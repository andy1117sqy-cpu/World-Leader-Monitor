import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  COUNTRIES_SORTED,
  COUNTRY_BY_ID,
  DEFAULT_START_ISO,
  START_ERA_OPTIONS,
  getInitialTerritoryOverrides,
} from '../data/countries.ts';
import type { CountryStats, GameSave } from '../types/game.ts';
import { STAT_FIELDS, formatDateReadable } from '../utils/format.ts';
import { WorldMap } from './WorldMap.tsx';

interface LobbyViewProps {
  saves: GameSave[];
  onStartGame: (params: {
    countryId: string;
    leaderName: string;
    stats: CountryStats;
    isCustom: boolean;
    startIsoDate: string;
    startDisplayDate: string;
  }) => void;
  onResumeGame: (saveId: string) => void;
  onDeleteGame: (saveId: string) => void;
  error: string | null;
}

const EMPTY_STATS_INPUT: Record<keyof CountryStats, string> = {
  population: '',
  gdp: '',
  unemployment: '',
  inflation: '',
  armedForces: '',
  tanks: '',
  fighterJets: '',
  aircraftCarriers: '',
};

function statsToStrings(s: CountryStats): Record<keyof CountryStats, string> {
  return {
    population: String(s.population),
    gdp: String(s.gdp),
    unemployment: String(s.unemployment),
    inflation: String(s.inflation),
    armedForces: String(s.armedForces),
    tanks: String(s.tanks),
    fighterJets: String(s.fighterJets),
    aircraftCarriers: String(s.aircraftCarriers),
  };
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  saves,
  onStartGame,
  onResumeGame,
  onDeleteGame,
  error,
}) => {
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedStartIso, setSelectedStartIso] = useState<string>(DEFAULT_START_ISO);
  const [customLeader, setCustomLeader] = useState<string>('');
  const [isCustomGame, setIsCustomGame] = useState<boolean>(false);
  const [statInputs, setStatInputs] = useState<Record<keyof CountryStats, string>>(EMPTY_STATS_INPUT);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selectedCountry = selectedCountryId ? COUNTRY_BY_ID[selectedCountryId] : null;
  const initialOverrides = React.useMemo(() => getInitialTerritoryOverrides(), []);
  const startDisplayDate = formatDateReadable(selectedStartIso);

  useEffect(() => {
    if (selectedCountry) {
      setStatInputs(statsToStrings(selectedCountry.stats));
    } else {
      setStatInputs(EMPTY_STATS_INPUT);
    }
  }, [selectedCountry]);

  const handleSelectCountry = (countryId: string) => {
    setSelectedCountryId(countryId);
  };

  const handleStatChange = (key: keyof CountryStats, value: string) => {
    setStatInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry) return;

    const parsedStats: CountryStats = isCustomGame
      ? {
          population: Math.max(0.001, Number(statInputs.population) || selectedCountry.stats.population),
          gdp: Math.max(0.1, Number(statInputs.gdp) || selectedCountry.stats.gdp),
          unemployment: Math.max(0, Math.min(85, Number(statInputs.unemployment) || 0)),
          inflation: Math.max(-20, Math.min(500, Number(statInputs.inflation) || 0)),
          armedForces: Math.max(0, Math.round(Number(statInputs.armedForces) || 0)),
          tanks: Math.max(0, Math.round(Number(statInputs.tanks) || 0)),
          fighterJets: Math.max(0, Math.round(Number(statInputs.fighterJets) || 0)),
          aircraftCarriers: Math.max(0, Math.round(Number(statInputs.aircraftCarriers) || 0)),
        }
      : { ...selectedCountry.stats };

    const leaderName = customLeader.trim() || selectedCountry.leader;

    onStartGame({
      countryId: selectedCountry.id,
      leaderName,
      stats: parsedStats,
      isCustom: isCustomGame,
      startIsoDate: selectedStartIso,
      startDisplayDate,
    });
  };

  const topRowFields = STAT_FIELDS.slice(0, 5);
  const bottomRowFields = STAT_FIELDS.slice(5, 8);

  return (
    <div className="space-y-5">
      {/* Printed Diplomatic Atlas Hero */}
      <WorldMap
        selectedCountryId={selectedCountryId || null}
        onSelectCountry={handleSelectCountry}
        territoryOverrides={initialOverrides}
        mode="lobby"
        heightClass="h-[370px] sm:h-[445px]"
      />

      {/* Lower Two-Column Editorial Setup & Archive Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
        {/* Left Panel: Lead a country */}
        <section className="lg:col-span-7 rounded-xl border border-[#dcd5c9] bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#171a1f]">
              Lead a country
            </h1>
            <span className="font-mono text-xs text-[#8b5a00] tabular-nums">
              Start: {startDisplayDate}
            </span>
          </div>
          <p className="mt-2 max-w-[66ch] text-sm leading-relaxed text-[#56606e]">
            The world as it stood on {startDisplayDate}. Choose a nation on the atlas or from the
            register below. You write what its government does; the map and national ledger follow
            what happens.
          </p>

          <form onSubmit={handleSubmit} className="mt-5">
            {/* Row 1: Country + Start Date */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
              <div className="sm:col-span-6">
                <label
                  htmlFor="country-select"
                  className="block text-xs font-medium text-[#374151]"
                >
                  Country
                </label>
                <div className="relative mt-1.5">
                  <select
                    id="country-select"
                    value={selectedCountryId}
                    onChange={(e) => handleSelectCountry(e.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border border-[#d4cdc0] bg-[#faf9f5] pr-9 pl-3.5 text-sm text-[#171a1f] transition-colors focus:border-[#173a63] focus:bg-white focus:outline-none"
                  >
                    <option value="">Choose a country</option>
                    {COUNTRIES_SORTED.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="start-era-select"
                  className="block text-xs font-medium text-[#374151]"
                >
                  Start date
                </label>
                {isCustomGame ? (
                  <input
                    id="start-era-select"
                    type="date"
                    value={selectedStartIso}
                    min="1900-01-01"
                    max="2099-12-31"
                    onChange={(e) => {
                      if (e.target.value) setSelectedStartIso(e.target.value);
                    }}
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#b9c6d6] bg-white px-3.5 font-mono text-sm text-[#171a1f] transition-colors focus:border-[#173a63] focus:outline-none"
                  />
                ) : (
                  <div className="relative mt-1.5">
                    <select
                      id="start-era-select"
                      value={
                        START_ERA_OPTIONS.some((o) => o.isoDate === selectedStartIso)
                          ? selectedStartIso
                          : DEFAULT_START_ISO
                      }
                      onChange={(e) => setSelectedStartIso(e.target.value)}
                      className="h-11 w-full appearance-none rounded-lg border border-[#d4cdc0] bg-[#faf9f5] pr-9 pl-3.5 text-sm text-[#171a1f] transition-colors focus:border-[#173a63] focus:bg-white focus:outline-none"
                    >
                      {START_ERA_OPTIONS.map((era) => (
                        <option key={era.id} value={era.isoDate}>
                          {era.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Leader Name + Take Office */}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
              <div className="sm:col-span-9">
                <label
                  htmlFor="leader-name"
                  className="block text-xs font-medium text-[#374151]"
                >
                  Your name{' '}
                  <span className="font-normal text-[#737c8a]">(blank: its real leader)</span>
                </label>
                <input
                  id="leader-name"
                  type="text"
                  value={customLeader}
                  onChange={(e) => setCustomLeader(e.target.value)}
                  placeholder={selectedCountry ? selectedCountry.leader : 'Leave blank for incumbent'}
                  maxLength={100}
                  className="mt-1.5 h-11 w-full rounded-lg border border-[#d4cdc0] bg-[#faf9f5] px-3.5 text-sm text-[#171a1f] placeholder:text-[#8c94a0] transition-colors focus:border-[#173a63] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={!selectedCountry}
                  className="flex h-11 w-full items-center justify-center rounded-lg bg-[#173a63] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1f4b7e] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173a63] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Take office
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-[#e3b8b8] bg-[#fdf3f3] px-3.5 py-2.5 text-xs text-[#9b2c2c]"
              >
                {error}
              </div>
            )}

            {/* Starting Figures Section */}
            <div className="mt-7 border-t border-[#ece7de] pt-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-serif text-lg font-semibold text-[#171a1f]">
                  Starting figures
                </h2>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#374151] select-none">
                  <input
                    type="checkbox"
                    checked={isCustomGame}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setIsCustomGame(next);
                      if (!next) {
                        if (selectedCountry) {
                          setStatInputs(statsToStrings(selectedCountry.stats));
                        }
                        if (!START_ERA_OPTIONS.some((o) => o.isoDate === selectedStartIso)) {
                          setSelectedStartIso(DEFAULT_START_ISO);
                        }
                      }
                    }}
                    className="h-4 w-4 rounded border-[#c7bfb0] accent-[#173a63]"
                  />
                  <span>Custom game</span>
                </label>
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {topRowFields.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={`stat-${field.key}`}
                      className="block truncate text-[11px] text-[#636c7a]"
                    >
                      {field.label}
                    </label>
                    <input
                      id={`stat-${field.key}`}
                      type="number"
                      step="any"
                      readOnly={!isCustomGame}
                      value={statInputs[field.key]}
                      onChange={(e) => handleStatChange(field.key, e.target.value)}
                      className={`mt-1.5 h-10 w-full rounded-lg border px-3 font-mono text-sm tabular-nums transition-colors focus:outline-none ${
                        isCustomGame
                          ? 'border-[#b9c6d6] bg-white text-[#171a1f] focus:border-[#173a63]'
                          : 'border-[#e4dfd5] bg-[#f7f5f0] text-[#2a313b] cursor-default'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {bottomRowFields.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={`stat-${field.key}`}
                      className="block truncate text-[11px] text-[#636c7a]"
                    >
                      {field.label}
                    </label>
                    <input
                      id={`stat-${field.key}`}
                      type="number"
                      step="1"
                      readOnly={!isCustomGame}
                      value={statInputs[field.key]}
                      onChange={(e) => handleStatChange(field.key, e.target.value)}
                      className={`mt-1.5 h-10 w-full rounded-lg border px-3 font-mono text-sm tabular-nums transition-colors focus:outline-none ${
                        isCustomGame
                          ? 'border-[#b9c6d6] bg-white text-[#171a1f] focus:border-[#173a63]'
                          : 'border-[#e4dfd5] bg-[#f7f5f0] text-[#2a313b] cursor-default'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </form>
        </section>

        {/* Right Panel: YOUR GAMES */}
        <aside className="lg:col-span-5 rounded-xl border border-[#dcd5c9] bg-white p-6 flex flex-col">
          <div className="border-b border-[#e8e3d9] pb-3.5">
            <h2 className="font-mono text-xs font-medium tracking-[0.14em] text-[#6b7280]">
              YOUR GAMES
            </h2>
          </div>

          {saves.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <p className="font-serif text-base text-[#374151]">No saved administrations yet.</p>
              <p className="mt-1.5 max-w-[32ch] text-xs leading-relaxed text-[#6b7280]">
                Select any nation on the atlas or from the register and take office to begin.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#eee9e0]">
              {saves.map((save) => (
                <li
                  key={save.id}
                  className="group flex items-center justify-between gap-3 py-4 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onResumeGame(save.id)}
                    className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173a63] rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate font-serif text-base font-semibold text-[#171a1f] group-hover:text-[#173a63] transition-colors">
                        {save.countryName}
                      </span>
                      {save.status !== 'active' && (
                        <span className="text-xs text-[#9b2c2c]">· Ended</span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[#5d6674]">
                      {save.leaderName}
                    </div>
                  </button>

                  <div className="flex items-center gap-4 shrink-0">
                    <button
                      type="button"
                      onClick={() => onResumeGame(save.id)}
                      className="text-right focus-visible:outline-none"
                    >
                      <div className="font-mono text-xs font-medium text-[#8b5a00] tabular-nums">
                        {save.currentDate}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-[#737c8a] tabular-nums">
                        turn {save.turn}
                      </div>
                    </button>

                    {confirmDeleteId === save.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteGame(save.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-xs font-medium text-[#9b2c2c] hover:text-[#7c1d1d] whitespace-nowrap"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-[#6b7280] hover:text-[#171a1f] whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(save.id)}
                        className="text-xs text-[#737c8a] transition-colors hover:text-[#9b2c2c] whitespace-nowrap"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
};
