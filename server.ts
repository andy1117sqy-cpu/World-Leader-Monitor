import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Type } from '@google/genai';
import { COUNTRIES, COUNTRY_BY_ID } from './src/data/countries.ts';
import {
  ProviderConfigError,
  generateStructuredJson,
  getConfiguredProviders,
  getDefaultProviderId,
  resolveRequestedProvider,
} from './src/server/llmProviders.ts';
import type {
  ActiveCrisis,
  AdministrationStatus,
  CountryStats,
  DiplomaticRelation,
  GovernanceMetrics,
  RelationStatus,
  TerritoryOverride,
  TerritoryStatus,
  TurnPace,
  TurnRecord,
  WorldHeadline,
} from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_RELATION_STATUSES = new Set<RelationStatus>([
  'ally', 'partner', 'neutral', 'tense', 'sanctioned', 'war',
]);
const VALID_SEVERITIES = new Set<ActiveCrisis['severity']>(['low', 'elevated', 'critical']);
const VALID_TERRITORY_STATUSES = new Set<TerritoryStatus>([
  'annexed', 'occupied', 'puppet', 'disputed', 'union', 'independent',
]);
const VALID_ADMIN_STATUSES = new Set<AdministrationStatus>([
  'active', 'ousted', 'resigned', 'conquered',
]);

const MAJOR_POWER_IDS = [
  '840', '156', '643', '276', '826', '250', '356', '392',
  '124', '076', '380', '616', '804', '792', '410', '036',
  '682', '376', '364', '158', '408', '304',
];

const COUNTRY_BY_LOWER_NAME: Record<string, string> = Object.fromEntries(
  COUNTRIES.flatMap((c) => {
    const entries: Array<[string, string]> = [[c.name.toLowerCase(), c.id]];
    if (c.mapName.toLowerCase() !== c.name.toLowerCase()) {
      entries.push([c.mapName.toLowerCase(), c.id]);
    }
    return entries;
  })
);

function resolveCountryId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (COUNTRY_BY_ID[trimmed]) return trimmed;
  const padded = trimmed.padStart(3, '0');
  if (COUNTRY_BY_ID[padded]) return padded;
  const lower = trimmed.toLowerCase();
  if (COUNTRY_BY_LOWER_NAME[lower]) return COUNTRY_BY_LOWER_NAME[lower];
  if (lower === 'usa' || lower === 'us' || lower === 'u.s.') return '840';
  if (lower === 'uk' || lower === 'britain' || lower === 'great britain') return '826';
  if (lower === 'uae') return '784';
  if (lower === 'drc') return '180';
  return undefined;
}

// Lean dynamic country ID directory (~30-45 relevant countries instead of all 175) to cut prompt latency
function buildRelevantCountryIndex(
  countryId: string,
  relations: DiplomaticRelation[] = [],
  directive = ''
): string {
  const ids = new Set<string>([countryId, ...MAJOR_POWER_IDS]);
  const player = COUNTRY_BY_ID[countryId];
  if (player) {
    for (const c of COUNTRIES) {
      if (c.region === player.region) {
        ids.add(c.id);
      }
    }
  }
  for (const r of relations) {
    if (COUNTRY_BY_ID[r.countryId]) ids.add(r.countryId);
  }
  const lowerDirective = directive.toLowerCase();
  if (lowerDirective) {
    for (const c of COUNTRIES) {
      if (lowerDirective.includes(c.name.toLowerCase())) {
        ids.add(c.id);
      }
    }
  }
  return Array.from(ids)
    .slice(0, 60)
    .map((id) => `${id}:${COUNTRY_BY_ID[id]?.name ?? id}`)
    .join(', ');
}

function addMonthsToIso(isoDate: string, months: number, extraDays = 0): string {
  const parts = isoDate.split('-').map(Number);
  const d = new Date(Date.UTC(parts[0] || 2026, (parts[1] || 1) - 1, parts[2] || 1));
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() + extraDays);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatReadableDate(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const year = parts[0] || 2026;
  const month = months[((parts[1] || 1) - 1 + 12) % 12];
  const day = parts[2] || 1;
  return `${day} ${month} ${year}`;
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

function sanitizeStats(raw: Partial<CountryStats>, fallback: CountryStats): CountryStats {
  return {
    population: roundTo(clamp(Number(raw.population ?? fallback.population), 0.001, 5000), 2),
    gdp: roundTo(clamp(Number(raw.gdp ?? fallback.gdp), 0.1, 200000), 1),
    unemployment: roundTo(clamp(Number(raw.unemployment ?? fallback.unemployment), 0.1, 85), 1),
    inflation: roundTo(clamp(Number(raw.inflation ?? fallback.inflation), -20, 500), 1),
    armedForces: Math.round(clamp(Number(raw.armedForces ?? fallback.armedForces), 0, 25000000)),
    tanks: Math.round(clamp(Number(raw.tanks ?? fallback.tanks), 0, 50000)),
    fighterJets: Math.round(clamp(Number(raw.fighterJets ?? fallback.fighterJets), 0, 15000)),
    aircraftCarriers: Math.round(clamp(Number(raw.aircraftCarriers ?? fallback.aircraftCarriers), 0, 50)),
  };
}

function sanitizeGovernance(
  raw: Partial<GovernanceMetrics>,
  fallback: GovernanceMetrics
): GovernanceMetrics {
  return {
    approval: Math.round(clamp(Number(raw.approval ?? fallback.approval), 0, 100)),
    stability: Math.round(clamp(Number(raw.stability ?? fallback.stability), 0, 100)),
    budgetBalance: roundTo(clamp(Number(raw.budgetBalance ?? fallback.budgetBalance), -60, 40), 1),
  };
}

const BRIEFING_JSON_CONTRACT = `Output strictly valid JSON matching this schema:
{
  "headline": "string (6-11 words)",
  "narrative": "string (2 concise paragraphs separated by \\n\\n)",
  "worldHeadlines": [{"dateline": "CITY", "text": "string", "countryId": "3-digit ID from IDs list"}],
  "activeEvents": [{"id": "slug", "title": "string", "severity": "low|elevated|critical", "summary": "string"}],
  "relations": [{"countryId": "3-digit ID", "countryName": "string", "status": "ally|partner|neutral|tense|sanctioned|war", "note": "short reason"}],
  "suggestedDirectives": ["string", "string", "string"]
}`;

const TURN_JSON_CONTRACT = `Output strictly valid JSON matching this schema:
{
  "nextIsoDate": "YYYY-MM-DD",
  "headline": "string (6-11 words)",
  "narrative": "string (2 tight paragraphs, 100-170 words total, separated by \\n\\n)",
  "worldHeadlines": [{"dateline": "CITY", "text": "string", "countryId": "3-digit ID"}],
  "newStats": {"population": number, "gdp": number, "unemployment": number, "inflation": number, "armedForces": number, "tanks": number, "fighterJets": number, "aircraftCarriers": number},
  "newGovernance": {"approval": number, "stability": number, "budgetBalance": number},
  "territoryChanges": [{"targetId": "3-digit ID", "controllerId": "3-digit ID", "status": "annexed|occupied|puppet|disputed|union|independent", "label": "string"}],
  "relations": [{"countryId": "3-digit ID", "countryName": "string", "status": "ally|partner|neutral|tense|sanctioned|war", "note": "short reason"}],
  "activeEvents": [{"id": "slug", "title": "string", "severity": "low|elevated|critical", "summary": "string"}],
  "suggestedDirectives": ["string", "string", "string"],
  "administrationStatus": "active|ousted|resigned|conquered",
  "endVerdict": "optional string only if administrationStatus is not active"
}`;

const BRIEFING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: 'Crisp broadsheet headline (6-11 words).' },
    narrative: {
      type: Type.STRING,
      description: 'Two concise, authoritative paragraphs for the starting date separated by double newline.',
    },
    worldHeadlines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dateline: { type: Type.STRING },
          text: { type: Type.STRING },
          countryId: { type: Type.STRING },
        },
        required: ['dateline', 'text'],
      },
    },
    activeEvents: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ['low', 'elevated', 'critical'] },
          summary: { type: Type.STRING },
        },
        required: ['id', 'title', 'severity', 'summary'],
      },
    },
    relations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          countryId: { type: Type.STRING },
          countryName: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['ally', 'partner', 'neutral', 'tense', 'sanctioned', 'war'] },
          note: { type: Type.STRING },
        },
        required: ['countryId', 'countryName', 'status', 'note'],
      },
    },
    suggestedDirectives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['headline', 'narrative', 'worldHeadlines', 'activeEvents', 'relations', 'suggestedDirectives'],
};

const TURN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    nextIsoDate: { type: Type.STRING, description: 'New YYYY-MM-DD date.' },
    headline: { type: Type.STRING, description: 'Crisp newspaper headline (6-11 words).' },
    narrative: {
      type: Type.STRING,
      description:
        'Two tight, realistic journalistic paragraphs (100-170 words total) covering domestic execution, economic/military outcome, and international reaction. Separate with double newline.',
    },
    worldHeadlines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dateline: { type: Type.STRING },
          text: { type: Type.STRING },
          countryId: { type: Type.STRING },
        },
        required: ['dateline', 'text'],
      },
    },
    newStats: {
      type: Type.OBJECT,
      properties: {
        population: { type: Type.NUMBER },
        gdp: { type: Type.NUMBER },
        unemployment: { type: Type.NUMBER },
        inflation: { type: Type.NUMBER },
        armedForces: { type: Type.NUMBER },
        tanks: { type: Type.NUMBER },
        fighterJets: { type: Type.NUMBER },
        aircraftCarriers: { type: Type.NUMBER },
      },
      required: [
        'population', 'gdp', 'unemployment', 'inflation',
        'armedForces', 'tanks', 'fighterJets', 'aircraftCarriers',
      ],
    },
    newGovernance: {
      type: Type.OBJECT,
      properties: {
        approval: { type: Type.NUMBER },
        stability: { type: Type.NUMBER },
        budgetBalance: { type: Type.NUMBER },
      },
      required: ['approval', 'stability', 'budgetBalance'],
    },
    territoryChanges: {
      type: Type.ARRAY,
      description: 'Only populate when sovereignty, occupation, annexation, union, or independence changes on the map; otherwise [].',
      items: {
        type: Type.OBJECT,
        properties: {
          targetId: { type: Type.STRING },
          controllerId: { type: Type.STRING },
          status: {
            type: Type.STRING,
            enum: ['annexed', 'occupied', 'puppet', 'disputed', 'union', 'independent'],
          },
          label: { type: Type.STRING },
        },
        required: ['targetId', 'controllerId', 'status', 'label'],
      },
    },
    relations: {
      type: Type.ARRAY,
      description:
        'List any diplomatic relationships newly formed, upgraded, downgraded, or meaningfully changed this turn. A country can maintain many allies, many partners, and multiple rivals simultaneously; unchanged existing ties are preserved automatically.',
      items: {
        type: Type.OBJECT,
        properties: {
          countryId: { type: Type.STRING },
          countryName: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['ally', 'partner', 'neutral', 'tense', 'sanctioned', 'war'] },
          note: { type: Type.STRING },
        },
        required: ['countryId', 'countryName', 'status', 'note'],
      },
    },
    activeEvents: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ['low', 'elevated', 'critical'] },
          summary: { type: Type.STRING },
        },
        required: ['id', 'title', 'severity', 'summary'],
      },
    },
    suggestedDirectives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    administrationStatus: {
      type: Type.STRING,
      enum: ['active', 'ousted', 'resigned', 'conquered'],
    },
    endVerdict: { type: Type.STRING },
  },
  required: [
    'nextIsoDate', 'headline', 'narrative', 'worldHeadlines', 'newStats',
    'newGovernance', 'territoryChanges', 'relations', 'activeEvents',
    'suggestedDirectives', 'administrationStatus',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/providers', (_req, res) => {
    res.json({
      defaultProvider: getDefaultProviderId(),
      providers: getConfiguredProviders(),
    });
  });

  // Optional background enrichment endpoint for alternate historical/future start eras
  app.post('/api/briefing', async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const { countryId, leaderName, stats, startIsoDate, provider } = body as {
        countryId?: string;
        leaderName?: string;
        stats?: CountryStats;
        startIsoDate?: string;
        provider?: string;
      };

      if (!countryId || !COUNTRY_BY_ID[countryId]) {
        res.status(400).json({ error: 'Invalid country selected.' });
        return;
      }

      const providerId = resolveRequestedProvider(provider);
      const country = COUNTRY_BY_ID[countryId];
      const safeLeader = (leaderName ?? country.leader).trim().slice(0, 120) || country.leader;
      const safeStats = sanitizeStats(stats ?? country.stats, country.stats);
      const isoDate = startIsoDate && /^\d{4}-\d{2}-\d{2}$/.test(startIsoDate) ? startIsoDate : '2026-01-01';
      const readableDate = formatReadableDate(isoDate);

      const prompt = [
        `Start Date: ${readableDate} (${isoDate}).`,
        `Country: ${country.name} (ID ${country.id}, ${country.region}). Leader: ${safeLeader}.`,
        `Figures: Pop ${safeStats.population}M, GDP $${safeStats.gdp}B, Unemp ${safeStats.unemployment}%, Infl ${safeStats.inflation}%, Forces ${safeStats.armedForces}, Tanks ${safeStats.tanks}, Jets ${safeStats.fighterJets}, Carriers ${safeStats.aircraftCarriers}.`,
        `Write an era-accurate ${readableDate} inauguration briefing (2 concise paragraphs), 2 wire headlines, 2-3 active events, 6-10 realistic multilateral bilateral relations (including multiple allies and multiple partners where historically appropriate), and 3 concrete opening directives.`,
        `IDs: ${buildRelevantCountryIndex(country.id)}`,
      ].join('\n');

      const result = await generateStructuredJson<{
        headline: string;
        narrative: string;
        worldHeadlines: WorldHeadline[];
        activeEvents: ActiveCrisis[];
        relations: DiplomaticRelation[];
        suggestedDirectives: string[];
      }>({
        providerId,
        systemInstruction:
          'You are the simulation engine for World Leader. Write concise, era-accurate Financial Times / Reuters prose. Use exact country IDs from IDs list.',
        userPrompt: prompt,
        geminiSchema: BRIEFING_SCHEMA,
        jsonContract: BRIEFING_JSON_CONTRACT,
      });

      const parsed = result.data;

      const cleanRelations: DiplomaticRelation[] = (Array.isArray(parsed.relations) ? parsed.relations : [])
        .map((r) => {
          const cid = resolveCountryId(r.countryId) ?? resolveCountryId(r.countryName);
          if (!cid || cid === countryId) return null;
          const safeStatus: RelationStatus = VALID_RELATION_STATUSES.has(r.status) ? r.status : 'neutral';
          return {
            countryId: cid,
            countryName: COUNTRY_BY_ID[cid]?.name ?? r.countryName,
            status: safeStatus,
            note: String(r.note ?? '').slice(0, 120),
          };
        })
        .filter((x): x is DiplomaticRelation => x !== null)
        .slice(0, 14);

      const cleanHeadlines: WorldHeadline[] = (Array.isArray(parsed.worldHeadlines) ? parsed.worldHeadlines : [])
        .slice(0, 3)
        .map((h) => ({
          dateline: String(h.dateline ?? 'WORLD').toUpperCase().slice(0, 24),
          text: String(h.text ?? '').slice(0, 180),
          countryId: resolveCountryId(h.countryId),
        }));

      const cleanEvents: ActiveCrisis[] = (Array.isArray(parsed.activeEvents) ? parsed.activeEvents : [])
        .slice(0, 3)
        .map((ev, idx) => ({
          id: String(ev.id || `event-${idx + 1}`).slice(0, 60),
          title: String(ev.title || 'Developing situation').slice(0, 120),
          severity: VALID_SEVERITIES.has(ev.severity) ? ev.severity : 'elevated',
          summary: String(ev.summary || '').slice(0, 240),
        }));

      res.json({
        headline: parsed.headline || `${safeLeader} takes office in ${country.name}`,
        narrative: parsed.narrative || '',
        worldHeadlines: cleanHeadlines,
        activeEvents: cleanEvents,
        relations: cleanRelations,
        suggestedDirectives: (Array.isArray(parsed.suggestedDirectives) ? parsed.suggestedDirectives : [])
          .map((d) => String(d).slice(0, 200))
          .slice(0, 3),
        provider: result.provider,
        model: result.model,
      });
    } catch (err) {
      if (err instanceof ProviderConfigError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error('Error in /api/briefing:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate briefing.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/turn', async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const {
        countryId,
        leaderName,
        currentIsoDate,
        turn,
        stats,
        governance,
        relations,
        activeEvents,
        territoryOverrides,
        recentTurns,
        directive,
        pace,
        provider,
      } = body as {
        countryId?: string;
        leaderName?: string;
        currentIsoDate?: string;
        turn?: number;
        stats?: CountryStats;
        governance?: GovernanceMetrics;
        relations?: DiplomaticRelation[];
        activeEvents?: ActiveCrisis[];
        territoryOverrides?: Record<string, TerritoryOverride>;
        recentTurns?: Array<{ turn: number; date: string; directive: string; headline: string }>;
        directive?: string;
        pace?: TurnPace;
        provider?: string;
      };

      if (!countryId || !COUNTRY_BY_ID[countryId]) {
        res.status(400).json({ error: 'Invalid country ID.' });
        return;
      }

      const trimmedDirective = (directive ?? '').trim();
      if (!trimmedDirective || trimmedDirective.length < 3) {
        res.status(400).json({ error: 'Please write a directive for your government.' });
        return;
      }
      if (trimmedDirective.length > 2000) {
        res.status(400).json({ error: 'Directive is too long (maximum 2,000 characters).' });
        return;
      }

      const providerId = resolveRequestedProvider(provider);
      const country = COUNTRY_BY_ID[countryId];
      const safeStats = sanitizeStats(stats ?? country.stats, country.stats);
      const safeGov = sanitizeGovernance(governance ?? country.governance, country.governance);
      const isoDate = currentIsoDate || '2026-01-01';
      const nextTurnNum = (Number(turn) || 0) + 1;
      const requestedPace: TurnPace = pace ?? 'auto';

      const paceInstruction =
        requestedPace === '1m'
          ? 'Advance ~1 month.'
          : requestedPace === '3m'
          ? 'Advance ~3 months.'
          : requestedPace === '6m'
          ? 'Advance ~6 months.'
          : requestedPace === '1y'
          ? 'Advance ~12 months.'
          : 'Advance 1-3 months naturally.';

      const activeMapChanges = Object.values(territoryOverrides ?? {})
        .filter((t) => t.status !== 'disputed' || t.controllerId === countryId)
        .map((t) => `${COUNTRY_BY_ID[t.targetId]?.name ?? t.targetId}(${t.targetId})=${t.status} by ${COUNTRY_BY_ID[t.controllerId]?.name ?? t.controllerId}(${t.controllerId})`)
        .join('; ');

      const historySummary = (recentTurns ?? [])
        .slice(-3)
        .map((t) => `T${t.turn} (${t.date}): "${t.directive || 'Start'}" -> ${t.headline}`)
        .join('\n');

      const relationsSummary = (relations ?? [])
        .slice(0, 20)
        .map((r) => `${r.countryName}(${r.countryId}):${r.status}`)
        .join(', ');

      const eventsSummary = (activeEvents ?? [])
        .slice(0, 3)
        .map((e) => `${e.title}(${e.severity})`)
        .join('; ');

      const prompt = [
        `Country: ${country.name} (${country.id}, ${country.region}) | Leader: ${leaderName || country.leader}`,
        `Date: ${formatReadableDate(isoDate)} (${isoDate}) | Turn ${nextTurnNum} | ${paceInstruction}`,
        `Stats: Pop=${safeStats.population}M, GDP=$${safeStats.gdp}B, Unemp=${safeStats.unemployment}%, Infl=${safeStats.inflation}%, Forces=${safeStats.armedForces}, Tanks=${safeStats.tanks}, Jets=${safeStats.fighterJets}, Carriers=${safeStats.aircraftCarriers}`,
        `Gov: Approval=${safeGov.approval}%, Stability=${safeGov.stability}%, Budget=${safeGov.budgetBalance}%GDP`,
        relationsSummary ? `Existing Relations: ${relationsSummary}` : '',
        eventsSummary ? `Active: ${eventsSummary}` : '',
        activeMapChanges ? `Map overrides: ${activeMapChanges}` : '',
        historySummary ? `Recent:\n${historySummary}` : '',
        `DIRECTIVE: ${trimmedDirective}`,
        `IDs: ${buildRelevantCountryIndex(country.id, relations, trimmedDirective)}`,
      ]
        .filter(Boolean)
        .join('\n');

      const result = await generateStructuredJson<{
        nextIsoDate?: string;
        headline: string;
        narrative: string;
        worldHeadlines: WorldHeadline[];
        newStats: CountryStats;
        newGovernance: GovernanceMetrics;
        territoryChanges: TerritoryOverride[];
        relations: DiplomaticRelation[];
        activeEvents: ActiveCrisis[];
        suggestedDirectives: string[];
        administrationStatus: AdministrationStatus;
        endVerdict?: string;
      }>({
        providerId,
        systemInstruction: [
          'You are the geopolitical simulation engine for World Leader. Simulate realistic consequences in crisp Financial Times / Reuters prose (2 tight paragraphs).',
          'Institutions, markets, voters, and foreign capitals push back realistically. Military procurement takes realistic time and budget. Update all 8 newStats and newGovernance proportionally.',
          'Multilateral diplomacy: nations routinely maintain many allies, many partners, and multiple rivals simultaneously. In relations, return any relationships newly created or changed this turn (existing unchanged allies and partners are preserved automatically).',
          'If borders, occupation, annexation, political union, or independence change, emit territoryChanges using exact IDs from IDs list; otherwise [].',
          'Keep administrationStatus "active" unless the leader genuinely resigns, loses office, is couped, or is conquered.',
        ].join(' '),
        userPrompt: prompt,
        geminiSchema: TURN_SCHEMA,
        jsonContract: TURN_JSON_CONTRACT,
      });

      const parsed = result.data;

      let nextIso =
        parsed.nextIsoDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.nextIsoDate)
          ? parsed.nextIsoDate
          : addMonthsToIso(
              isoDate,
              requestedPace === '1y' ? 12 : requestedPace === '6m' ? 6 : requestedPace === '1m' ? 1 : 2,
              14
            );
      if (nextIso <= isoDate) {
        nextIso = addMonthsToIso(isoDate, 2, 14);
      }

      const nextStats = sanitizeStats(parsed.newStats ?? safeStats, safeStats);
      const nextGov = sanitizeGovernance(parsed.newGovernance ?? safeGov, safeGov);

      const statDeltas: Partial<CountryStats> = {
        population: roundTo(nextStats.population - safeStats.population, 2),
        gdp: roundTo(nextStats.gdp - safeStats.gdp, 1),
        unemployment: roundTo(nextStats.unemployment - safeStats.unemployment, 1),
        inflation: roundTo(nextStats.inflation - safeStats.inflation, 1),
        armedForces: nextStats.armedForces - safeStats.armedForces,
        tanks: nextStats.tanks - safeStats.tanks,
        fighterJets: nextStats.fighterJets - safeStats.fighterJets,
        aircraftCarriers: nextStats.aircraftCarriers - safeStats.aircraftCarriers,
      };

      const governanceDeltas: Partial<GovernanceMetrics> = {
        approval: nextGov.approval - safeGov.approval,
        stability: nextGov.stability - safeGov.stability,
        budgetBalance: roundTo(nextGov.budgetBalance - safeGov.budgetBalance, 1),
      };

      const validTerritoryChanges: TerritoryOverride[] = (Array.isArray(parsed.territoryChanges) ? parsed.territoryChanges : [])
        .map((tc) => {
          const targetId = resolveCountryId(tc.targetId);
          const controllerId = resolveCountryId(tc.controllerId);
          if (!targetId || !controllerId) return null;
          const safeStatus: TerritoryStatus = VALID_TERRITORY_STATUSES.has(tc.status) ? tc.status : 'disputed';
          return {
            targetId,
            controllerId,
            status: safeStatus,
            label: String(
              tc.label ?? `${safeStatus} by ${COUNTRY_BY_ID[controllerId]?.name ?? controllerId}`
            ).slice(0, 100),
          };
        })
        .filter((x): x is TerritoryOverride => x !== null);

      const incomingRelations: DiplomaticRelation[] = (Array.isArray(parsed.relations) ? parsed.relations : [])
        .map((r) => {
          const cid = resolveCountryId(r.countryId) ?? resolveCountryId(r.countryName);
          if (!cid || cid === countryId) return null;
          const safeStatus: RelationStatus = VALID_RELATION_STATUSES.has(r.status) ? r.status : 'neutral';
          return {
            countryId: cid,
            countryName: COUNTRY_BY_ID[cid]?.name ?? r.countryName,
            status: safeStatus,
            note: String(r.note ?? '').slice(0, 120),
          };
        })
        .filter((x): x is DiplomaticRelation => x !== null);

      // Merge incoming updates into existing bilateral relations so multiple allies/partners are preserved across turns
      const mergedMap = new Map<string, DiplomaticRelation>();
      for (const existing of relations ?? []) {
        if (existing && existing.countryId && existing.countryId !== countryId) {
          mergedMap.set(existing.countryId, existing);
        }
      }
      for (const updated of incomingRelations) {
        mergedMap.set(updated.countryId, updated);
      }
      const mergedRelations = Array.from(mergedMap.values()).slice(0, 30);

      const validHeadlines: WorldHeadline[] = (Array.isArray(parsed.worldHeadlines) ? parsed.worldHeadlines : [])
        .slice(0, 3)
        .map((h) => ({
          dateline: String(h.dateline ?? 'WORLD').toUpperCase().slice(0, 24),
          text: String(h.text ?? '').slice(0, 180),
          countryId: resolveCountryId(h.countryId),
        }));

      const validEvents: ActiveCrisis[] = (Array.isArray(parsed.activeEvents) ? parsed.activeEvents : [])
        .slice(0, 4)
        .map((ev, idx) => ({
          id: String(ev.id || `event-${nextTurnNum}-${idx + 1}`).slice(0, 60),
          title: String(ev.title || 'Developing situation').slice(0, 120),
          severity: VALID_SEVERITIES.has(ev.severity) ? ev.severity : 'elevated',
          summary: String(ev.summary || '').slice(0, 240),
        }));

      const safeAdminStatus: AdministrationStatus = VALID_ADMIN_STATUSES.has(parsed.administrationStatus)
        ? parsed.administrationStatus
        : 'active';

      const turnRecord: TurnRecord = {
        turn: nextTurnNum,
        date: formatReadableDate(nextIso),
        isoDate: nextIso,
        directive: trimmedDirective,
        headline: parsed.headline || `Turn ${nextTurnNum} developments`,
        narrative: parsed.narrative || '',
        worldHeadlines: validHeadlines,
        statDeltas,
        governanceDeltas,
        territoryChanges: validTerritoryChanges,
        suggestedDirectives: (Array.isArray(parsed.suggestedDirectives) ? parsed.suggestedDirectives : [])
          .map((d) => String(d).slice(0, 200))
          .slice(0, 3),
        statsSnapshot: nextStats,
        governanceSnapshot: nextGov,
      };

      res.json({
        turnRecord,
        newStats: nextStats,
        newGovernance: nextGov,
        relations: mergedRelations,
        activeEvents: validEvents,
        administrationStatus: safeAdminStatus,
        endVerdict: parsed.endVerdict ? String(parsed.endVerdict).slice(0, 400) : undefined,
        provider: result.provider,
        model: result.model,
      });
    } catch (err) {
      if (err instanceof ProviderConfigError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error('Error in /api/turn:', err);
      const message = err instanceof Error ? err.message : 'Simulation turn failed. Please try again.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`World Leader server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
