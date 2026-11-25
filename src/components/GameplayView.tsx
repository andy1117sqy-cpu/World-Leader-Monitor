import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Maximize2, Minimize2, ArrowRight, RotateCcw } from 'lucide-react';
import { COUNTRY_BY_ID } from '../data/countries.ts';
import type {
  GameSave,
  RelationStatus,
  TurnPace,
  TurnRecord,
} from '../types/game.ts';
import {
  STAT_FIELDS,
  formatDelta,
  formatStatValue,
} from '../utils/format.ts';
import { WorldMap } from './WorldMap.tsx';
import { HistoryChart } from './HistoryChart.tsx';

interface GameplayViewProps {
  save: GameSave;
  onIssueDirective: (directive: string, pace: TurnPace) => Promise<boolean>;
  onReturnToLobby: () => void;
  isProcessing: boolean;
  pendingDirective: string | null;
  error: string | null;
}

type SideTab = 'diplomacy' | 'events' | 'trends';
type RelationFilter = 'all' | 'ally' | 'partner' | 'tensions';

const PACE_OPTIONS: Array<{ value: TurnPace; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: '1m', label: '1 mo' },
  { value: '3m', label: '3 mo' },
  { value: '6m', label: '6 mo' },
  { value: '1y', label: '1 yr' },
];

const RELATION_GROUPS: Array<{
  status: RelationStatus;
  pluralLabel: string;
  colorClass: string;
}> = [
  { status: 'war', pluralLabel: 'At war', colorClass: 'text-[#9b2c2c]' },
  { status: 'sanctioned', pluralLabel: 'Sanctioned', colorClass: 'text-[#9a4b1f]' },
  { status: 'tense', pluralLabel: 'Tense', colorClass: 'text-[#8b5a00]' },
  { status: 'ally', pluralLabel: 'Allies', colorClass: 'text-[#1d6346]' },
  { status: 'partner', pluralLabel: 'Partners', colorClass: 'text-[#1f5f7a]' },
  { status: 'neutral', pluralLabel: 'Neutral', colorClass: 'text-[#66707e]' },
];

function getGovLevelLabel(val: number): string {
  if (val >= 70) return 'Strong';
  if (val >= 50) return 'Steady';
  if (val >= 32) return 'Strained';
  return 'Critical';
}

export const GameplayView: React.FC<GameplayViewProps> = ({
  save,
  onIssueDirective,
  onReturnToLobby,
  isProcessing,
  pendingDirective,
  error,
}) => {
  const [directive, setDirective] = useState('');
  const [pace, setPace] = useState<TurnPace>('auto');
  const [sideTab, setSideTab] = useState<SideTab>('diplomacy');
  const [relationFilter, setRelationFilter] = useState<RelationFilter>('all');
  const [focusCountryId, setFocusCountryId] = useState<string | null>(null);
  const [expandedMap, setExpandedMap] = useState(false);
  const chronicleEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const latestTurn: TurnRecord | undefined = save.turns[save.turns.length - 1];

  useEffect(() => {
    if (save.turns.length > 1 || pendingDirective) {
      chronicleEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [save.turns.length, pendingDirective]);

  const highlightCountryIds = useMemo(() => {
    if (!latestTurn) return [];
    const ids = new Set<string>();
    for (const h of latestTurn.worldHeadlines) {
      if (h.countryId) ids.add(h.countryId);
    }
    for (const tc of latestTurn.territoryChanges) {
      ids.add(tc.targetId);
    }
    return Array.from(ids);
  }, [latestTurn]);

  const relationCounts = useMemo(() => {
    let allies = 0;
    let partners = 0;
    let tensions = 0;
    for (const r of save.relations) {
      if (r.status === 'ally') allies++;
      else if (r.status === 'partner') partners++;
      else if (r.status === 'war' || r.status === 'sanctioned' || r.status === 'tense') tensions++;
    }
    return { total: save.relations.length, allies, partners, tensions };
  }, [save.relations]);

  const groupedRelations = useMemo(() => {
    return RELATION_GROUPS.map((group) => {
      const items = save.relations
        .filter((r) => {
          if (r.status !== group.status) return false;
          if (relationFilter === 'ally') return r.status === 'ally';
          if (relationFilter === 'partner') return r.status === 'partner';
          if (relationFilter === 'tensions') {
            return r.status === 'war' || r.status === 'sanctioned' || r.status === 'tense';
          }
          return true;
        })
        .sort((a, b) => a.countryName.localeCompare(b.countryName));
      return { ...group, items };
    }).filter((g) => g.items.length > 0);
  }, [save.relations, relationFilter]);

  const controlledTerritories = useMemo(() => {
    return Object.values(save.territoryOverrides).filter(
      (t) => t.controllerId === save.countryId && t.targetId !== save.countryId
    );
  }, [save.territoryOverrides, save.countryId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = directive.trim();
    if (!trimmed || isProcessing || save.status !== 'active') return;
    setDirective('');
    const ok = await onIssueDirective(trimmed, pace);
    if (!ok) {
      // Restore draft if the turn failed so the player doesn't lose what they wrote
      setDirective(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleMentionCountry = (countryName: string) => {
    setDirective((prev) => {
      const prefix = prev.trim() ? `${prev.trim()} ` : '';
      return `${prefix}${countryName}: `;
    });
    textareaRef.current?.focus();
  };

  const renderTurnDeltas = (turn: TurnRecord) => {
    const items: Array<{ label: string; text: string; tone: 'good' | 'bad' | 'neutral' }> = [];

    const gdpDelta = formatDelta(turn.statDeltas.gdp, 'B', 0);
    if (gdpDelta) {
      items.push({
        label: 'GDP',
        text: gdpDelta.startsWith('+') ? `+$${gdpDelta.slice(1)}` : `-$${gdpDelta.slice(1)}`,
        tone: (turn.statDeltas.gdp ?? 0) >= 0 ? 'good' : 'bad',
      });
    }

    const unempDelta = formatDelta(turn.statDeltas.unemployment, '%', 1);
    if (unempDelta) {
      items.push({
        label: 'Unemployment',
        text: unempDelta,
        tone: (turn.statDeltas.unemployment ?? 0) <= 0 ? 'good' : 'bad',
      });
    }

    const infDelta = formatDelta(turn.statDeltas.inflation, '%', 1);
    if (infDelta) {
      items.push({
        label: 'Inflation',
        text: infDelta,
        tone: (turn.statDeltas.inflation ?? 0) <= 0 ? 'good' : 'bad',
      });
    }

    const forcesDelta = formatDelta(turn.statDeltas.armedForces, '', 0);
    if (forcesDelta) {
      items.push({ label: 'Armed forces', text: forcesDelta, tone: 'neutral' });
    }

    const appDelta = formatDelta(turn.governanceDeltas.approval, '%', 0);
    if (appDelta) {
      items.push({
        label: 'Approval',
        text: appDelta,
        tone: (turn.governanceDeltas.approval ?? 0) >= 0 ? 'good' : 'bad',
      });
    }

    if (items.length === 0 && turn.territoryChanges.length === 0) return null;

    return (
      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#ece7de] pt-3 font-mono text-xs tabular-nums">
        {items.map((item) => (
          <span key={item.label} className="text-[#66707e]">
            {item.label}{' '}
            <span
              className={
                item.tone === 'good'
                  ? 'font-medium text-[#1d6346]'
                  : item.tone === 'bad'
                  ? 'font-medium text-[#9b2c2c]'
                  : 'font-medium text-[#2c3440]'
              }
            >
              {item.text}
            </span>
          </span>
        ))}
        {turn.territoryChanges.map((tc) => (
          <span key={`${tc.targetId}-${tc.status}`} className="font-medium text-[#8b5a00]">
            Map: {COUNTRY_BY_ID[tc.targetId]?.name ?? tc.targetId} — {tc.label}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Live Diplomatic Atlas */}
      <div className="relative">
        <WorldMap
          selectedCountryId={save.countryId}
          playerCountryId={save.countryId}
          onSelectCountry={() => {}}
          territoryOverrides={save.territoryOverrides}
          relations={save.relations}
          highlightCountryIds={highlightCountryIds}
          focusCountryId={focusCountryId}
          mode="gameplay"
          heightClass={expandedMap ? 'h-[480px] sm:h-[550px]' : 'h-[300px] sm:h-[350px]'}
          onMentionCountry={handleMentionCountry}
        />

        <button
          type="button"
          onClick={() => setExpandedMap((v) => !v)}
          aria-label={expandedMap ? 'Compact map' : 'Expand map'}
          title={expandedMap ? 'Compact map' : 'Expand map'}
          className="absolute right-14 top-3.5 flex h-8 items-center gap-1.5 rounded-lg border border-[#cfc8ba] bg-white/95 px-2.5 text-xs font-medium text-[#374151] shadow-xs transition-colors hover:bg-[#f0ede6] hover:text-[#173a63]"
        >
          {expandedMap ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{expandedMap ? 'Compact' : 'Expand'}</span>
        </button>
      </div>

      {/* Main Two-Column Play Workspace */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        {/* Left Column: Editorial State Chronicle + Executive Desk */}
        <section className="lg:col-span-7 rounded-xl border border-[#dcd5c9] bg-white flex flex-col overflow-hidden">
          {/* Administration Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8e3d9] px-6 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#171a1f] truncate">
                  {save.countryName}
                </h1>
                {save.isCustom && (
                  <span className="font-mono text-xs text-[#6d7684]">· Custom</span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[#596370] truncate">{save.leaderName}</p>
            </div>

            <div className="text-right shrink-0">
              <div className="font-mono text-sm font-semibold text-[#8b5a00] tabular-nums">
                {save.currentDate}
              </div>
              <div className="mt-0.5 font-mono text-xs text-[#737c8a] tabular-nums">
                turn {save.turn}
              </div>
            </div>
          </div>

          {/* Scrollable Broadsheet Chronicle */}
          <div className="max-h-[540px] overflow-y-auto px-6 py-5 space-y-6">
            {save.turns.map((turn) => (
              <article
                key={turn.turn}
                className="border-b border-[#ece7de] pb-6 last:border-b-0 last:pb-1"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-serif text-lg font-semibold text-[#171a1f] text-balance">
                    {turn.headline}
                  </h2>
                  <div className="font-mono text-xs text-[#737c8a] tabular-nums whitespace-nowrap shrink-0">
                    <span className="font-medium text-[#8b5a00]">{turn.date}</span>
                    <span className="mx-1.5 text-[#c9c2b5]">·</span>
                    <span>{turn.turn === 0 ? 'Inauguration' : `turn ${turn.turn}`}</span>
                  </div>
                </div>

                {turn.directive && (
                  <div className="mt-3 rounded-lg border border-[#e6e0d5] bg-[#f8f6f1] px-3.5 py-2.5">
                    <div className="text-[11px] font-medium text-[#697280]">Government directive</div>
                    <p className="mt-1 text-sm leading-relaxed text-[#171a1f]">{turn.directive}</p>
                  </div>
                )}

                <div className="mt-3.5 space-y-3 text-sm leading-[1.72] text-[#2c3440]">
                  {turn.narrative
                    .split(/\n\n+/)
                    .filter((p) => p.trim())
                    .map((para, i) => (
                      <p key={i}>{para.trim()}</p>
                    ))}
                </div>

                {turn.worldHeadlines.length > 0 && (
                  <div className="mt-4 space-y-1.5 border-t border-[#ece7de] pt-3">
                    {turn.worldHeadlines.map((wh, idx) => (
                      <div key={idx} className="flex items-baseline gap-2 text-xs leading-relaxed">
                        <span className="font-mono text-[11px] font-semibold text-[#173a63] shrink-0">
                          {wh.dateline}
                        </span>
                        <span className="text-[#b8b1a4]">—</span>
                        {wh.countryId ? (
                          <button
                            type="button"
                            onClick={() => setFocusCountryId(wh.countryId!)}
                            className="text-left text-[#444e5c] underline-offset-2 hover:text-[#173a63] hover:underline"
                          >
                            {wh.text}
                          </button>
                        ) : (
                          <span className="text-[#444e5c]">{wh.text}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {turn.turn > 0 && renderTurnDeltas(turn)}
              </article>
            ))}

            {/* Instant Optimistic Pending Turn Display */}
            {isProcessing && pendingDirective && (
              <article className="border-t border-[#ece7de] pt-5">
                <div className="rounded-lg border border-[#d6e0ec] bg-[#f4f7fb] px-3.5 py-2.5">
                  <div className="text-[11px] font-medium text-[#173a63]">
                    Directive issued · turn {save.turn + 1}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[#171a1f]">{pendingDirective}</p>
                </div>
                <div className="mt-3 flex items-center gap-2.5 text-xs text-[#596370]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#173a63] shrink-0" />
                  <span>Dispatches arriving from ministries and foreign capitals…</span>
                </div>
              </article>
            )}

            <div ref={chronicleEndRef} />
          </div>

          {/* Executive Directive Composer OR Administration Concluded */}
          {save.status === 'active' ? (
            <form
              onSubmit={handleSubmit}
              className="border-t border-[#e4dfd5] bg-[#faf8f4] px-6 py-5"
            >
              {error && (
                <div
                  role="alert"
                  className="mb-3.5 rounded-lg border border-[#e3b8b8] bg-[#fdf3f3] px-3.5 py-2.5 text-xs text-[#9b2c2c]"
                >
                  {error}
                </div>
              )}

              <label htmlFor="directive-input" className="block text-xs font-medium text-[#374151]">
                What does your government do next?
              </label>

              <textarea
                ref={textareaRef}
                id="directive-input"
                rows={3}
                value={directive}
                onChange={(e) => setDirective(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
                placeholder={`Write policy decrees, budgets, treaties, military orders, or reforms for ${save.countryName}…`}
                className="mt-2 w-full resize-none rounded-lg border border-[#d4cdc0] bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#171a1f] placeholder:text-[#8c94a0] transition-colors focus:border-[#173a63] focus:outline-none disabled:opacity-60"
              />

              {latestTurn && latestTurn.suggestedDirectives.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="text-[11px] font-medium text-[#6b7280]">Cabinet proposals</div>
                  <div className="flex flex-col gap-1.5">
                    {latestTurn.suggestedDirectives.map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={isProcessing}
                        onClick={() => {
                          setDirective(suggestion);
                          textareaRef.current?.focus();
                        }}
                        className="group flex items-center justify-between gap-2 rounded-md border border-[#e2dcd0] bg-white px-3 py-2 text-left text-xs text-[#454f5d] transition-colors hover:border-[#b9c6d6] hover:bg-[#f5f8fc] hover:text-[#171a1f] disabled:opacity-50"
                      >
                        <span className="line-clamp-1">{suggestion}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#9aa3af] group-hover:text-[#173a63]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-lg border border-[#ddd6c9] bg-white p-1">
                  <span className="px-2 text-[11px] text-[#6b7280]">Pace</span>
                  {PACE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPace(opt.value)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        pace === opt.value
                          ? 'bg-[#173a63] text-white'
                          : 'text-[#5b6573] hover:bg-[#f2efe8] hover:text-[#171a1f]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline font-mono text-[11px] text-[#7b8491]">
                    Ctrl+Enter
                  </span>
                  <button
                    type="submit"
                    disabled={isProcessing || directive.trim().length < 3}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#173a63] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1f4b7e] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173a63]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Executing</span>
                      </>
                    ) : (
                      <span>Issue directive</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="border-t border-[#e4dfd5] bg-[#faf8f4] px-6 py-5">
              <div className="font-mono text-xs uppercase tracking-[0.12em] text-[#9b2c2c]">
                Administration concluded · {save.status}
              </div>
              {save.endVerdict && (
                <p className="mt-2 text-sm leading-relaxed text-[#2c3440]">{save.endVerdict}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onReturnToLobby}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#173a63] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1f4b7e]"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Start a new administration</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: National Ledger & Intelligence */}
        <aside className="lg:col-span-5 space-y-5">
          {/* National Figures Card */}
          <div className="rounded-xl border border-[#dcd5c9] bg-white p-6">
            <div className="flex items-baseline justify-between gap-2 border-b border-[#e8e3d9] pb-3.5">
              <h2 className="font-serif text-lg font-semibold text-[#171a1f]">
                National ledger
              </h2>
              <span className="font-mono text-xs text-[#6b7280] tabular-nums">
                as of {save.currentDate}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
              {STAT_FIELDS.map((field) => {
                const currentVal = save.currentStats[field.key];
                const lastDelta = latestTurn?.statDeltas?.[field.key];
                const deltaStr = formatDelta(lastDelta, '', field.decimals);
                const isPositiveMove =
                  lastDelta !== undefined &&
                  (field.goodWhenHigher ? lastDelta > 0 : lastDelta < 0);

                return (
                  <div
                    key={field.key}
                    className="border-b border-[#f0ece4] pb-3 last:border-b-0"
                  >
                    <div className="text-[11px] text-[#66707e]">{field.label}</div>
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <span className="font-mono text-base font-semibold text-[#171a1f] tabular-nums">
                        {formatStatValue(field.key, currentVal)}
                      </span>
                      {deltaStr && (
                        <span
                          className={`font-mono text-xs font-medium tabular-nums ${
                            field.key === 'population' ||
                            field.key === 'armedForces' ||
                            field.key === 'tanks' ||
                            field.key === 'fighterJets' ||
                            field.key === 'aircraftCarriers'
                              ? 'text-[#596370]'
                              : isPositiveMove
                              ? 'text-[#1d6346]'
                              : 'text-[#9b2c2c]'
                          }`}
                        >
                          {deltaStr}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Governance Indicators */}
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#e8e3d9] pt-4">
              <div>
                <div className="text-[11px] text-[#66707e]">Approval</div>
                <div className="mt-1 font-mono text-sm font-semibold text-[#171a1f] tabular-nums">
                  {save.governance.approval}%
                </div>
                <div className="text-[11px] text-[#596370]">
                  {getGovLevelLabel(save.governance.approval)}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-[#66707e]">Stability</div>
                <div className="mt-1 font-mono text-sm font-semibold text-[#171a1f] tabular-nums">
                  {save.governance.stability}%
                </div>
                <div className="text-[11px] text-[#596370]">
                  {getGovLevelLabel(save.governance.stability)}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-[#66707e]">Budget / GDP</div>
                <div className="mt-1 font-mono text-sm font-semibold text-[#171a1f] tabular-nums">
                  {save.governance.budgetBalance > 0 ? '+' : ''}
                  {save.governance.budgetBalance.toFixed(1)}%
                </div>
                <div className="text-[11px] text-[#596370]">
                  {save.governance.budgetBalance >= 0
                    ? 'Surplus'
                    : save.governance.budgetBalance > -4
                    ? 'Moderate deficit'
                    : 'Heavy deficit'}
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Intelligence & Trends Panel */}
          <div className="rounded-xl border border-[#dcd5c9] bg-white p-6">
            <div className="flex items-center gap-1 rounded-lg bg-[#f4f1ea] p-1 border border-[#e4dfd5]">
              {(
                [
                  { id: 'diplomacy', label: 'Diplomacy' },
                  { id: 'events', label: 'Active events' },
                  { id: 'trends', label: 'Trends' },
                ] as Array<{ id: SideTab; label: string }>
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSideTab(tab.id)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    sideTab === tab.id
                      ? 'bg-white text-[#171a1f] shadow-xs'
                      : 'text-[#626b78] hover:text-[#171a1f]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {sideTab === 'diplomacy' && (
                <div className="space-y-4">
                  {controlledTerritories.length > 0 && (
                    <div className="border-b border-[#ece7de] pb-3.5">
                      <div className="text-[11px] font-medium text-[#66707e]">
                        Territories under your control
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {controlledTerritories.map((t) => (
                          <li key={t.targetId} className="flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => setFocusCountryId(t.targetId)}
                              className="font-medium text-[#171a1f] hover:text-[#173a63]"
                            >
                              {COUNTRY_BY_ID[t.targetId]?.name ?? t.targetId}
                            </button>
                            <span className="font-medium text-[#8b5a00] capitalize">{t.status}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Multilateral Stance Filter */}
                  {save.relations.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 border-b border-[#ece7de] pb-3">
                      {(
                        [
                          { id: 'all', label: `All (${relationCounts.total})` },
                          { id: 'ally', label: `Allies (${relationCounts.allies})` },
                          { id: 'partner', label: `Partners (${relationCounts.partners})` },
                          { id: 'tensions', label: `Tensions (${relationCounts.tensions})` },
                        ] as Array<{ id: RelationFilter; label: string }>
                      ).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setRelationFilter(f.id)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            relationFilter === f.id
                              ? 'bg-[#173a63] text-white'
                              : 'text-[#5b6573] hover:bg-[#f2efe8] hover:text-[#171a1f]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {groupedRelations.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[#6b7280]">
                      {save.relations.length === 0
                        ? 'No major bilateral dossiers recorded yet.'
                        : 'No countries match this diplomatic filter.'}
                    </p>
                  ) : (
                    <div className="max-h-[380px] space-y-4 overflow-y-auto pr-1">
                      {groupedRelations.map((group) => (
                        <div key={group.status}>
                          <div className="flex items-baseline justify-between border-b border-[#eee9e0] pb-1.5">
                            <span className={`font-mono text-[11px] font-semibold uppercase tracking-[0.08em] ${group.colorClass}`}>
                              {group.pluralLabel}
                            </span>
                            <span className="font-mono text-[11px] text-[#7b8491] tabular-nums">
                              {group.items.length}
                            </span>
                          </div>
                          <ul className="divide-y divide-[#f3efe7]">
                            {group.items.map((rel) => (
                              <li key={rel.countryId} className="py-2 last:pb-0">
                                <button
                                  type="button"
                                  onClick={() => setFocusCountryId(rel.countryId)}
                                  className="text-sm font-medium text-[#171a1f] hover:text-[#173a63] text-left transition-colors"
                                >
                                  {rel.countryName}
                                </button>
                                <p className="mt-0.5 text-xs text-[#636c7a]">{rel.note}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {sideTab === 'events' && (
                <div>
                  {save.activeEvents.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[#6b7280]">
                      No active crises on the national docket.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#f0ece4]">
                      {save.activeEvents.map((ev) => (
                        <li key={ev.id} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-medium text-[#171a1f]">{ev.title}</span>
                            <span
                              className={`font-mono text-[11px] font-medium capitalize shrink-0 ${
                                ev.severity === 'critical'
                                  ? 'text-[#9b2c2c]'
                                  : ev.severity === 'elevated'
                                  ? 'text-[#8b5a00]'
                                  : 'text-[#66707e]'
                              }`}
                            >
                              {ev.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-[#596370]">{ev.summary}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {sideTab === 'trends' && (
                <HistoryChart turns={save.turns} startDate={save.startDate || '1 Jan 2026'} />
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
