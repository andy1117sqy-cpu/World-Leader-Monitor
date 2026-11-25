export interface CountryStats {
  population: number; // in millions
  gdp: number; // in USD billions
  unemployment: number; // percentage
  inflation: number; // percentage
  armedForces: number; // active personnel
  tanks: number;
  fighterJets: number;
  aircraftCarriers: number;
}

export interface GovernanceMetrics {
  approval: number; // 0-100
  stability: number; // 0-100
  budgetBalance: number; // % of GDP (e.g. -2.5)
}

export interface CountryProfile {
  id: string;
  name: string;
  mapName: string;
  leader: string;
  region: string;
  color: string;
  sovereignId?: string;
  hatched?: boolean;
  stats: CountryStats;
  governance: GovernanceMetrics;
  startingContext?: string;
}

export type TerritoryStatus =
  | 'annexed'
  | 'occupied'
  | 'puppet'
  | 'disputed'
  | 'union'
  | 'independent';

export interface TerritoryOverride {
  targetId: string;
  controllerId: string;
  status: TerritoryStatus;
  label: string;
}

export type RelationStatus =
  | 'ally'
  | 'partner'
  | 'neutral'
  | 'tense'
  | 'sanctioned'
  | 'war';

export interface DiplomaticRelation {
  countryId: string;
  countryName: string;
  status: RelationStatus;
  note: string;
}

export interface WorldHeadline {
  dateline: string;
  text: string;
  countryId?: string;
}

export interface ActiveCrisis {
  id: string;
  title: string;
  severity: 'low' | 'elevated' | 'critical';
  summary: string;
}

export interface TurnRecord {
  turn: number;
  date: string;
  isoDate: string;
  directive: string;
  headline: string;
  narrative: string;
  worldHeadlines: WorldHeadline[];
  statDeltas: Partial<CountryStats>;
  governanceDeltas: Partial<GovernanceMetrics>;
  territoryChanges: TerritoryOverride[];
  suggestedDirectives: string[];
  statsSnapshot: CountryStats;
  governanceSnapshot: GovernanceMetrics;
}

export type AdministrationStatus = 'active' | 'ousted' | 'resigned' | 'conquered';

export type TurnPace = 'auto' | '1m' | '3m' | '6m' | '1y';

export type MapLayer = 'political' | 'diplomatic' | 'military';

export interface StartEraOption {
  id: string;
  label: string;
  isoDate: string;
  displayDate: string;
  subtitle: string;
}

export interface GameSave {
  id: string;
  countryId: string;
  countryName: string;
  leaderName: string;
  startDate: string;
  startIsoDate: string;
  currentDate: string;
  isoDate: string;
  turn: number;
  isCustom: boolean;
  initialStats: CountryStats;
  currentStats: CountryStats;
  governance: GovernanceMetrics;
  territoryOverrides: Record<string, TerritoryOverride>;
  relations: DiplomaticRelation[];
  activeEvents: ActiveCrisis[];
  turns: TurnRecord[];
  status: AdministrationStatus;
  endVerdict?: string;
  updatedAt: number;
}
