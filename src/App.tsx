import { useEffect, useState } from 'react';
import {
  COUNTRY_BY_ID,
  DEFAULT_START_ISO,
  buildInstantBriefing,
  getInitialTerritoryOverrides,
} from './data/countries.ts';
import type {
  ActiveCrisis,
  AdministrationStatus,
  CountryStats,
  DiplomaticRelation,
  GameSave,
  GovernanceMetrics,
  TerritoryOverride,
  TurnPace,
  TurnRecord,
  WorldHeadline,
} from './types/game.ts';
import { deleteSave, loadSaves, upsertSave } from './utils/storage.ts';
import { LobbyView } from './components/LobbyView.tsx';
import { GameplayView } from './components/GameplayView.tsx';

function createGameId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [saves, setSaves] = useState<GameSave[]>([]);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [pendingDirective, setPendingDirective] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSaves(loadSaves());
  }, []);

  const activeSave = saves.find((s) => s.id === activeGameId) ?? null;

  // Instant zero-latency launch into GameplayView!
  // If an alternate historical/future start era was selected, asynchronously enrich Turn 0 in the background.
  const handleStartGame = (params: {
    countryId: string;
    leaderName: string;
    stats: CountryStats;
    isCustom: boolean;
    startIsoDate: string;
    startDisplayDate: string;
  }) => {
    const country = COUNTRY_BY_ID[params.countryId];
    if (!country) return;

    setError(null);
    const instant = buildInstantBriefing({
      country,
      leaderName: params.leaderName,
      stats: params.stats,
      startDisplayDate: params.startDisplayDate,
      startIsoDate: params.startIsoDate,
    });

    const initialGov: GovernanceMetrics = { ...country.governance };
    const turnZero: TurnRecord = {
      turn: 0,
      date: params.startDisplayDate,
      isoDate: params.startIsoDate,
      directive: '',
      headline: instant.headline,
      narrative: instant.narrative,
      worldHeadlines: instant.worldHeadlines,
      statDeltas: {},
      governanceDeltas: {},
      territoryChanges: [],
      suggestedDirectives: instant.suggestedDirectives,
      statsSnapshot: { ...params.stats },
      governanceSnapshot: initialGov,
    };

    const newSave: GameSave = {
      id: createGameId(),
      countryId: country.id,
      countryName: country.name,
      leaderName: params.leaderName,
      startDate: params.startDisplayDate,
      startIsoDate: params.startIsoDate,
      currentDate: params.startDisplayDate,
      isoDate: params.startIsoDate,
      turn: 0,
      isCustom: params.isCustom,
      initialStats: { ...params.stats },
      currentStats: { ...params.stats },
      governance: initialGov,
      territoryOverrides: getInitialTerritoryOverrides(),
      relations: instant.relations,
      activeEvents: instant.activeEvents,
      turns: [turnZero],
      status: 'active',
      updatedAt: Date.now(),
    };

    const nextSaves = upsertSave(newSave);
    setSaves(nextSaves);
    setActiveGameId(newSave.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // For non-default historical/future eras, quietly enrich Turn 0 in background without blocking play
    if (params.startIsoDate !== DEFAULT_START_ISO) {
      fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryId: params.countryId,
          leaderName: params.leaderName,
          stats: params.stats,
          startIsoDate: params.startIsoDate,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then(
          (
            payload: {
              headline?: string;
              narrative?: string;
              worldHeadlines?: WorldHeadline[];
              activeEvents?: ActiveCrisis[];
              relations?: DiplomaticRelation[];
              suggestedDirectives?: string[];
            } | null
          ) => {
            if (!payload || !payload.narrative) return;
            setSaves((prev) => {
              const target = prev.find((s) => s.id === newSave.id);
              if (!target || target.turn > 0) return prev;
              const enrichedTurnZero: TurnRecord = {
                ...target.turns[0],
                headline: payload.headline || target.turns[0].headline,
                narrative: payload.narrative || target.turns[0].narrative,
                worldHeadlines:
                  payload.worldHeadlines && payload.worldHeadlines.length > 0
                    ? payload.worldHeadlines
                    : target.turns[0].worldHeadlines,
                suggestedDirectives:
                  payload.suggestedDirectives && payload.suggestedDirectives.length > 0
                    ? payload.suggestedDirectives
                    : target.turns[0].suggestedDirectives,
              };
              const updated: GameSave = {
                ...target,
                relations:
                  payload.relations && payload.relations.length > 0
                    ? payload.relations
                    : target.relations,
                activeEvents:
                  payload.activeEvents && payload.activeEvents.length > 0
                    ? payload.activeEvents
                    : target.activeEvents,
                turns: [enrichedTurnZero],
                updatedAt: Date.now(),
              };
              return upsertSave(updated);
            });
          }
        )
        .catch(() => {
          // Instant local briefing already covers Turn 0 cleanly
        });
    }
  };

  const handleIssueDirective = async (directive: string, pace: TurnPace): Promise<boolean> => {
    if (!activeSave || isProcessingTurn) return false;

    setError(null);
    setIsProcessingTurn(true);
    setPendingDirective(directive);

    try {
      const response = await fetch('/api/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryId: activeSave.countryId,
          leaderName: activeSave.leaderName,
          currentIsoDate: activeSave.isoDate,
          turn: activeSave.turn,
          stats: activeSave.currentStats,
          governance: activeSave.governance,
          relations: activeSave.relations,
          activeEvents: activeSave.activeEvents,
          territoryOverrides: activeSave.territoryOverrides,
          recentTurns: activeSave.turns.slice(-4).map((t) => ({
            turn: t.turn,
            date: t.date,
            directive: t.directive,
            headline: t.headline,
          })),
          directive,
          pace,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        turnRecord?: TurnRecord;
        newStats?: CountryStats;
        newGovernance?: GovernanceMetrics;
        relations?: DiplomaticRelation[];
        activeEvents?: ActiveCrisis[];
        administrationStatus?: AdministrationStatus;
        endVerdict?: string;
      };

      if (!response.ok || !payload.turnRecord) {
        throw new Error(payload.error || 'Simulation turn failed. Please try again.');
      }

      const nextOverrides: Record<string, TerritoryOverride> = {
        ...activeSave.territoryOverrides,
      };
      for (const tc of payload.turnRecord.territoryChanges) {
        if (tc.status === 'independent' && tc.targetId === tc.controllerId) {
          delete nextOverrides[tc.targetId];
        } else {
          nextOverrides[tc.targetId] = tc;
        }
      }

      const updatedSave: GameSave = {
        ...activeSave,
        currentDate: payload.turnRecord.date,
        isoDate: payload.turnRecord.isoDate,
        turn: payload.turnRecord.turn,
        currentStats: payload.newStats ?? activeSave.currentStats,
        governance: payload.newGovernance ?? activeSave.governance,
        territoryOverrides: nextOverrides,
        relations: payload.relations ?? activeSave.relations,
        activeEvents: payload.activeEvents ?? activeSave.activeEvents,
        turns: [...activeSave.turns, payload.turnRecord],
        status: payload.administrationStatus ?? 'active',
        endVerdict: payload.endVerdict ?? activeSave.endVerdict,
        updatedAt: Date.now(),
      };

      const nextSaves = upsertSave(updatedSave);
      setSaves(nextSaves);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation turn failed.');
      return false;
    } finally {
      setIsProcessingTurn(false);
      setPendingDirective(null);
    }
  };

  const handleResumeGame = (saveId: string) => {
    setError(null);
    setActiveGameId(saveId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteGame = (saveId: string) => {
    const next = deleteSave(saveId);
    setSaves(next);
    if (activeGameId === saveId) {
      setActiveGameId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#171a1f]">
      {/* Archival Broadsheet Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#dfd8cb] bg-[#f6f4ef]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setActiveGameId(null);
            }}
            className="font-serif text-lg font-bold tracking-[0.06em] text-[#171a1f] transition-opacity hover:opacity-80 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173a63] rounded"
          >
            WORLD LEADER
          </button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setActiveGameId(null);
            }}
            className={`rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173a63] ${
              activeSave
                ? 'border-[#173a63] bg-[#173a63] text-white hover:bg-[#1f4b7e]'
                : 'border-[#d4cdc0] bg-white text-[#374151] hover:bg-[#efece4] hover:text-[#171a1f]'
            }`}
          >
            Games{saves.length > 0 ? ` (${saves.length})` : ''}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6">
        {activeSave ? (
          <GameplayView
            save={activeSave}
            onIssueDirective={handleIssueDirective}
            onReturnToLobby={() => {
              setError(null);
              setActiveGameId(null);
            }}
            isProcessing={isProcessingTurn}
            pendingDirective={pendingDirective}
            error={error}
          />
        ) : (
          <LobbyView
            saves={saves}
            onStartGame={handleStartGame}
            onResumeGame={handleResumeGame}
            onDeleteGame={handleDeleteGame}
            error={error}
          />
        )}
      </main>
    </div>
  );
}
