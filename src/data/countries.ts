import type {
  ActiveCrisis,
  CountryProfile,
  CountryStats,
  DiplomaticRelation,
  StartEraOption,
  TerritoryOverride,
  WorldHeadline,
} from '../types/game.ts';

export const DEFAULT_START_ISO = '2026-01-01';
export const DEFAULT_START_DISPLAY = '1 Jan 2026';

export const START_ERA_OPTIONS: StartEraOption[] = [
  {
    id: '2026',
    label: '1 Jan 2026 — Modern World',
    isoDate: '2026-01-01',
    displayDate: '1 Jan 2026',
    subtitle: 'Current geopolitical baseline',
  },
  {
    id: '2027',
    label: '1 Jan 2027 — Near-Term Horizon',
    isoDate: '2027-01-01',
    displayDate: '1 Jan 2027',
    subtitle: 'Mid-decade trade & AI realignment',
  },
  {
    id: '2030',
    label: '1 Jan 2030 — Next Decade',
    isoDate: '2030-01-01',
    displayDate: '1 Jan 2030',
    subtitle: 'Multipolar 2030s transition',
  },
  {
    id: '1991',
    label: '1 Jan 1991 — Post-Cold War Dawn',
    isoDate: '1991-01-01',
    displayDate: '1 Jan 1991',
    subtitle: 'Gulf crisis & Soviet twilight',
  },
  {
    id: '1962',
    label: '1 Oct 1962 — Cold War Peak',
    isoDate: '1962-10-01',
    displayDate: '1 Oct 1962',
    subtitle: 'Superpower nuclear standoff',
  },
];

// Printed Diplomatic Atlas palette: refined muted cartographic tints calibrated for pale-ice oceans (#dce5ed)
const ATLAS_PALETTE = [
  '#b8c9a8', // archival sage
  '#d8c39e', // warm parchment ochre
  '#c8b3c9', // muted heather plum
  '#a5c4c7', // mineral celadon
  '#d4aba0', // dusty rosewood
  '#b1b9d4', // slate periwinkle
  '#abc7b7', // seafoam lichen
  '#cfc89b', // antique linen gold
  '#c9b1bd', // faded mulberry
  '#a3bdd4', // atlas cerulean
  '#cfb5a8', // soft sandstone
  '#aec4a4', // botanical olive
];

function pickColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return ATLAS_PALETTE[h % ATLAS_PALETTE.length];
}

interface RawCountryTuple {
  id: string;
  name: string;
  mapName?: string;
  leader: string;
  region: string;
  color?: string;
  sovereignId?: string;
  hatched?: boolean;
  stats: CountryStats;
  approval?: number;
  stability?: number;
  budgetBalance?: number;
  startingContext?: string;
}

const RAW_COUNTRIES: RawCountryTuple[] = [
  {
    id: '840',
    name: 'United States',
    mapName: 'United States of America',
    leader: 'Donald Trump, President',
    region: 'North America',
    color: '#d8c39e',
    stats: { population: 338.1, gdp: 30480, unemployment: 4.2, inflation: 2.7, armedForces: 1325000, tanks: 4640, fighterJets: 1860, aircraftCarriers: 11 },
    approval: 47, stability: 70, budgetBalance: -6.1,
    startingContext: 'Entering the second year of a second term ahead of the November 2026 midterms. Reciprocal tariff regimes, federal restructuring, and AI infrastructure buildouts are reshaping trade while Washington presses NATO allies on defense burden-sharing.'
  },
  {
    id: '276',
    name: 'Germany',
    leader: 'Friedrich Merz, Chancellor',
    region: 'Europe',
    color: '#abc7b7',
    stats: { population: 84.3, gdp: 4710, unemployment: 6.2, inflation: 2.1, armedForces: 184000, tanks: 315, fighterJets: 228, aircraftCarriers: 0 },
    approval: 41, stability: 73, budgetBalance: -2.9,
    startingContext: 'Berlin’s new coalition is deploying a landmark defense and infrastructure investment package after relaxing strict borrowing caps, aiming to revive stagnant manufacturing, modernize the Bundeswehr, and anchor European security.'
  },
  {
    id: '156',
    name: 'China',
    leader: 'Xi Jinping, President',
    region: 'Asia',
    color: '#a5c4c7',
    stats: { population: 1406.5, gdp: 19380, unemployment: 5.1, inflation: 0.7, armedForces: 2035000, tanks: 5050, fighterJets: 1245, aircraftCarriers: 3 },
    approval: 67, stability: 76, budgetBalance: -5.2,
    startingContext: 'Launching its 15th Five-Year Plan amid persistent property-sector deleveraging and Western tariff walls, doubling down on domestic consumption stimulus, indigenous AI semiconductors, green-tech exports, and blue-water naval expansion.'
  },
  {
    id: '643',
    name: 'Russia',
    leader: 'Vladimir Putin, President',
    region: 'Europe & Asia',
    color: '#c8b3c9',
    stats: { population: 143.4, gdp: 2240, unemployment: 2.5, inflation: 8.8, armedForces: 1340000, tanks: 5450, fighterJets: 825, aircraftCarriers: 1 },
    approval: 73, stability: 65, budgetBalance: -2.4,
    startingContext: 'Approaching the fourth year of conflict in Ukraine with a heavily militarized industrial base, tight labor markets, elevated interest rates, and intense diplomatic maneuvering over ceasefire conditions and sanctions relief.'
  },
  {
    id: '826',
    name: 'United Kingdom',
    leader: 'Keir Starmer, Prime Minister',
    region: 'Europe',
    color: '#d4aba0',
    stats: { population: 68.7, gdp: 3720, unemployment: 4.5, inflation: 2.5, armedForces: 143500, tanks: 213, fighterJets: 122, aircraftCarriers: 2 },
    approval: 32, stability: 74, budgetBalance: -4.1,
    startingContext: 'Downing Street is pursuing planning reforms, NHS wait-list cuts, and higher defense commitments while balancing tighter European security alignment against U.S. trade negotiations.'
  },
  {
    id: '250',
    name: 'France',
    leader: 'Emmanuel Macron, President',
    region: 'Europe',
    color: '#cfb5a8',
    stats: { population: 68.6, gdp: 3260, unemployment: 7.5, inflation: 1.7, armedForces: 204500, tanks: 215, fighterJets: 228, aircraftCarriers: 1 },
    approval: 27, stability: 62, budgetBalance: -5.4,
    startingContext: 'Operating with a fractured parliament ahead of the 2027 presidential cycle, Paris is working to curb a 5.4% deficit while championing European defense procurement and nuclear deterrence.'
  },
  {
    id: '356',
    name: 'India',
    leader: 'Narendra Modi, Prime Minister',
    region: 'Asia',
    color: '#c9b1bd',
    stats: { population: 1454.0, gdp: 4240, unemployment: 7.5, inflation: 4.5, armedForces: 1460000, tanks: 4650, fighterJets: 612, aircraftCarriers: 2 },
    approval: 63, stability: 76, budgetBalance: -4.5,
    startingContext: 'Sustaining world-leading major-economy growth as electronics assembly, defense indigenization, and highway infrastructure scale rapidly, while New Delhi balances strategic autonomy across Washington, Europe, Moscow, and Beijing.'
  },
  {
    id: '392',
    name: 'Japan',
    leader: 'Sanae Takaichi, Prime Minister',
    region: 'Asia',
    color: '#d4b3bc',
    stats: { population: 123.1, gdp: 4190, unemployment: 2.5, inflation: 2.6, armedForces: 247500, tanks: 520, fighterJets: 224, aircraftCarriers: 2 },
    approval: 46, stability: 80, budgetBalance: -3.4,
    startingContext: 'Tokyo navigates normalizing Bank of Japan interest rates, sustained wage growth, semiconductor fab subsidies, and accelerating Indo-Pacific defense modernization.'
  },
  {
    id: '124',
    name: 'Canada',
    leader: 'Mark Carney, Prime Minister',
    region: 'North America',
    color: '#b8c9a8',
    stats: { population: 41.6, gdp: 2290, unemployment: 6.5, inflation: 2.0, armedForces: 71000, tanks: 74, fighterJets: 65, aircraftCarriers: 0 },
    approval: 48, stability: 78, budgetBalance: -1.9,
    startingContext: 'Ottawa is diversifying energy and critical-mineral exports toward Europe and Asia, removing interprovincial trade barriers, and boosting Arctic defense spending amid ongoing North American trade friction.'
  },
  {
    id: '076',
    name: 'Brazil',
    leader: 'Luiz Inácio Lula da Silva, President',
    region: 'South America',
    color: '#d4aba0',
    stats: { population: 212.8, gdp: 2260, unemployment: 6.3, inflation: 4.6, armedForces: 360000, tanks: 469, fighterJets: 50, aircraftCarriers: 0 },
    approval: 45, stability: 67, budgetBalance: -6.5,
    startingContext: 'Heading into an October 2026 presidential election year with solid agricultural exports, high central-bank rates keeping inflation in check, and renewed focus on fiscal credibility and green industrialization.'
  },
  {
    id: '380',
    name: 'Italy',
    leader: 'Giorgia Meloni, Prime Minister',
    region: 'Europe',
    color: '#aec4a4',
    stats: { population: 58.8, gdp: 2440, unemployment: 6.1, inflation: 1.6, armedForces: 166000, tanks: 200, fighterJets: 174, aircraftCarriers: 2 },
    approval: 46, stability: 75, budgetBalance: -3.3,
    startingContext: 'Rome leverages rare political continuity to trim its fiscal deficit, channel EU recovery funds into industrial energy links with North Africa, and act as a transatlantic diplomatic bridge.'
  },
  {
    id: '724',
    name: 'Spain',
    leader: 'Pedro Sánchez, Prime Minister',
    region: 'Europe',
    color: '#cfc89b',
    stats: { population: 49.1, gdp: 1810, unemployment: 10.2, inflation: 2.4, armedForces: 134000, tanks: 327, fighterJets: 141, aircraftCarriers: 1 },
    approval: 37, stability: 70, budgetBalance: -2.8,
    startingContext: 'Leading Eurozone growth through renewables, tourism, and skilled immigration while tackling urban housing shortages and navigating delicate parliamentary arithmetic.'
  },
  {
    id: '616',
    name: 'Poland',
    leader: 'Donald Tusk, Prime Minister',
    region: 'Europe',
    color: '#b4c9a8',
    stats: { population: 36.5, gdp: 925, unemployment: 4.9, inflation: 3.9, armedForces: 225000, tanks: 690, fighterJets: 68, aircraftCarriers: 0 },
    approval: 43, stability: 74, budgetBalance: -5.1,
    startingContext: 'NATO’s largest per-GDP defense spender is integrating hundreds of new Abrams and K2 tanks while accelerating nuclear power construction and safeguarding the eastern EU border.'
  },
  {
    id: '804',
    name: 'Ukraine',
    leader: 'Volodymyr Zelenskyy, President',
    region: 'Europe',
    color: '#a3bdd4',
    stats: { population: 36.4, gdp: 196, unemployment: 14.0, inflation: 10.5, armedForces: 890000, tanks: 1120, fighterJets: 84, aircraftCarriers: 0 },
    approval: 56, stability: 53, budgetBalance: -17.5,
    startingContext: 'Kyiv pairs an expanded domestic drone and missile industry with intense diplomatic efforts to secure durable European and transatlantic security guarantees and reconstruction funding.'
  },
  {
    id: '792',
    name: 'Turkey',
    leader: 'Recep Tayyip Erdoğan, President',
    region: 'Europe & Middle East',
    color: '#c2b0c9',
    stats: { population: 85.8, gdp: 1420, unemployment: 8.5, inflation: 29.5, armedForces: 355200, tanks: 2240, fighterJets: 205, aircraftCarriers: 1 },
    approval: 45, stability: 65, budgetBalance: -4.2,
    startingContext: 'Disinflation is gradually taking hold as Ankara expands defense exports, cements regional leverage across Syria and the Black Sea, and seeks deeper European defense-industrial ties.'
  },
  {
    id: '410',
    name: 'South Korea',
    leader: 'Lee Jae-myung, President',
    region: 'Asia',
    color: '#a8b7d1',
    stats: { population: 51.6, gdp: 1930, unemployment: 2.9, inflation: 2.0, armedForces: 500000, tanks: 2250, fighterJets: 320, aircraftCarriers: 0 },
    approval: 54, stability: 72, budgetBalance: -2.4,
    startingContext: 'Restoring institutional stability after 2025’s snap election, Seoul focuses on semiconductor and shipbuilding competitiveness, U.S. tariff management, and deterrence on the Korean Peninsula.'
  },
  {
    id: '036',
    name: 'Australia',
    leader: 'Anthony Albanese, Prime Minister',
    region: 'Oceania',
    color: '#b1b9d4',
    stats: { population: 27.6, gdp: 1860, unemployment: 4.1, inflation: 2.4, armedForces: 58500, tanks: 75, fighterJets: 72, aircraftCarriers: 0 },
    approval: 46, stability: 85, budgetBalance: -1.1,
    startingContext: 'Returned to office with a renewed mandate to address housing supply, transition the energy grid, advance AUKUS submarine milestones, and stabilize trade with China.'
  },
  {
    id: '484',
    name: 'Mexico',
    leader: 'Claudia Sheinbaum, President',
    region: 'North America',
    color: '#c4b1c9',
    stats: { population: 131.6, gdp: 1910, unemployment: 2.8, inflation: 3.7, armedForces: 242000, tanks: 0, fighterJets: 3, aircraftCarriers: 0 },
    approval: 68, stability: 65, budgetBalance: -3.9,
    startingContext: 'Entering the 2026 USMCA trade review with strong domestic political backing while managing cross-border tariff negotiations, nearshoring infrastructure, and internal security.'
  },
  {
    id: '032',
    name: 'Argentina',
    leader: 'Javier Milei, President',
    region: 'South America',
    color: '#b1b4d4',
    stats: { population: 47.0, gdp: 645, unemployment: 6.6, inflation: 28.0, armedForces: 72500, tanks: 230, fighterJets: 30, aircraftCarriers: 0 },
    approval: 54, stability: 64, budgetBalance: 0.4,
    startingContext: 'Bolstered by legislative gains and sharply reduced inflation, Buenos Aires is liberalizing capital controls, attracting shale and lithium investment, and modernizing its air force with F-16s.'
  },
  {
    id: '682',
    name: 'Saudi Arabia',
    leader: 'Mohammed bin Salman, Crown Prince & PM',
    region: 'Middle East',
    color: '#d8c5a0',
    stats: { population: 34.4, gdp: 1160, unemployment: 3.6, inflation: 1.9, armedForces: 257000, tanks: 840, fighterJets: 285, aircraftCarriers: 0 },
    approval: 73, stability: 79, budgetBalance: -3.1,
    startingContext: 'Prioritizing core Vision 2030 tourism, AI data-center, and logistics megaprojects while balancing OPEC+ oil revenues and regional de-escalation.'
  },
  {
    id: '376',
    name: 'Israel',
    leader: 'Benjamin Netanyahu, Prime Minister',
    region: 'Middle East',
    color: '#a3bfd4',
    stats: { population: 10.1, gdp: 552, unemployment: 2.9, inflation: 3.0, armedForces: 170000, tanks: 1300, fighterJets: 245, aircraftCarriers: 0 },
    approval: 40, stability: 58, budgetBalance: -5.4,
    startingContext: 'Entering an election year with a resilient tech sector, elevated defense spending, and ongoing strategic deterrence across the Levant and against Iran.'
  },
  {
    id: '364',
    name: 'Iran',
    leader: 'Masoud Pezeshkian, President',
    region: 'Middle East',
    color: '#cfa9b3',
    stats: { population: 90.4, gdp: 446, unemployment: 8.2, inflation: 34.0, armedForces: 610000, tanks: 1713, fighterJets: 186, aircraftCarriers: 0 },
    approval: 39, stability: 52, budgetBalance: -5.6,
    startingContext: 'Confronting domestic energy shortages, high inflation, and tight sanctions while recalibrating regional strategy and weighing nuclear negotiations.'
  },
  {
    id: '158',
    name: 'Taiwan',
    leader: 'Lai Ching-te, President',
    region: 'Asia',
    color: '#a8cbb9',
    stats: { population: 23.4, gdp: 835, unemployment: 3.3, inflation: 2.0, armedForces: 170000, tanks: 680, fighterJets: 292, aircraftCarriers: 0 },
    approval: 49, stability: 75, budgetBalance: -1.0,
    startingContext: 'Anchoring global AI chip fabrication while raising asymmetric defense spending, securing grid resilience, and navigating persistent PLA drills in the Taiwan Strait.'
  },
  {
    id: '408',
    name: 'North Korea',
    leader: 'Kim Jong Un, Supreme Leader',
    region: 'Asia',
    color: '#d4a3a8',
    stats: { population: 26.3, gdp: 41, unemployment: 2.9, inflation: 12.0, armedForces: 1280000, tanks: 4300, fighterJets: 458, aircraftCarriers: 0 },
    approval: 65, stability: 69, budgetBalance: -4.0,
    startingContext: 'Leveraging Moscow security ties for fuel, revenue, and aerospace know-how while expanding solid-fuel missile and naval strike capabilities.'
  },
  {
    id: '360',
    name: 'Indonesia',
    leader: 'Prabowo Subianto, President',
    region: 'Asia',
    color: '#d4b3a3',
    stats: { population: 283.8, gdp: 1490, unemployment: 4.8, inflation: 2.1, armedForces: 400000, tanks: 313, fighterJets: 45, aircraftCarriers: 0 },
    approval: 74, stability: 77, budgetBalance: -2.6,
    startingContext: 'Scaling national nutrition programs, sovereign wealth fund Danantara, and mineral downstreaming while practicing active non-alignment across BRICS and OECD.'
  },
  {
    id: '586',
    name: 'Pakistan',
    leader: 'Shehbaz Sharif, Prime Minister',
    region: 'Asia',
    color: '#abc4b0',
    stats: { population: 248.5, gdp: 392, unemployment: 6.2, inflation: 6.5, armedForces: 654000, tanks: 2627, fighterJets: 332, aircraftCarriers: 0 },
    approval: 36, stability: 51, budgetBalance: -6.1,
    startingContext: 'Maintaining IMF fiscal discipline and single-digit inflation while courting Gulf and Chinese infrastructure investment amid western border security challenges.'
  },
  {
    id: '818',
    name: 'Egypt',
    leader: 'Abdel Fattah el-Sisi, President',
    region: 'Africa',
    color: '#d9c59e',
    stats: { population: 116.2, gdp: 398, unemployment: 6.6, inflation: 16.5, armedForces: 438500, tanks: 3620, fighterJets: 242, aircraftCarriers: 2 },
    approval: 45, stability: 63, budgetBalance: -6.4,
    startingContext: 'Gradual recovery in Suez Canal traffic and Gulf capital inflows ease currency stress as Cairo manages regional spillover from Gaza, Libya, and Sudan.'
  },
  {
    id: '710',
    name: 'South Africa',
    leader: 'Cyril Ramaphosa, President',
    region: 'Africa',
    color: '#c9cc9b',
    stats: { population: 63.8, gdp: 421, unemployment: 31.4, inflation: 3.4, armedForces: 70200, tanks: 195, fighterJets: 26, aircraftCarriers: 0 },
    approval: 50, stability: 63, budgetBalance: -4.4,
    startingContext: 'Building on grid stabilization and freight-rail reforms under the Government of National Unity while tackling structural youth unemployment and export diversification.'
  },
  {
    id: '566',
    name: 'Nigeria',
    leader: 'Bola Tinubu, President',
    region: 'Africa',
    color: '#a8c9b4',
    stats: { population: 233.5, gdp: 274, unemployment: 5.2, inflation: 22.0, armedForces: 135000, tanks: 317, fighterJets: 16, aircraftCarriers: 0 },
    approval: 38, stability: 55, budgetBalance: -4.3,
    startingContext: 'Domestic refining capacity and recovering crude output are easing foreign-exchange pressure as Abuja advances tax reform and grid upgrades.'
  },
  {
    id: '528',
    name: 'Netherlands',
    leader: 'Dick Schoof, Prime Minister',
    region: 'Europe',
    color: '#d4b89e',
    stats: { population: 18.1, gdp: 1265, unemployment: 3.8, inflation: 2.7, armedForces: 43000, tanks: 18, fighterJets: 46, aircraftCarriers: 0 },
    approval: 38, stability: 78, budgetBalance: -2.1,
    startingContext: 'Balancing agricultural nitrogen rules, housing shortages, and strategic semiconductor export controls centered on ASML.'
  },
  {
    id: '752',
    name: 'Sweden',
    leader: 'Ulf Kristersson, Prime Minister',
    region: 'Europe',
    color: '#a3bfd1',
    stats: { population: 10.6, gdp: 635, unemployment: 8.1, inflation: 1.7, armedForces: 26000, tanks: 110, fighterJets: 98, aircraftCarriers: 0 },
    approval: 45, stability: 82, budgetBalance: -0.9,
    startingContext: 'Approaching a September 2026 general election while expanding Baltic NATO integration, nuclear power investment, and defense-industrial output.'
  },
  {
    id: '578',
    name: 'Norway',
    leader: 'Jonas Gahr Støre, Prime Minister',
    region: 'Europe',
    color: '#abc9bd',
    stats: { population: 5.6, gdp: 498, unemployment: 4.0, inflation: 2.2, armedForces: 24000, tanks: 44, fighterJets: 46, aircraftCarriers: 0 },
    approval: 44, stability: 88, budgetBalance: 10.8,
    startingContext: 'Europe’s vital gas supplier and steward of a $1.9T sovereign wealth fund, prioritizing High North Arctic security and energy-transition exports.'
  },
  {
    id: '246',
    name: 'Finland',
    leader: 'Petteri Orpo, Prime Minister',
    region: 'Europe',
    color: '#aec0d1',
    stats: { population: 5.6, gdp: 318, unemployment: 8.2, inflation: 1.4, armedForces: 24500, tanks: 200, fighterJets: 62, aircraftCarriers: 0 },
    approval: 42, stability: 85, budgetBalance: -3.1,
    startingContext: 'Fortifying NATO’s 1,340-kilometer eastern flank and Baltic subsea infrastructure while rebuilding growth through clean-tech and icebreaker exports.'
  },
  {
    id: '208',
    name: 'Denmark',
    leader: 'Mette Frederiksen, Prime Minister',
    region: 'Europe',
    color: '#cfaeb8',
    stats: { population: 6.0, gdp: 445, unemployment: 2.9, inflation: 1.8, armedForces: 17000, tanks: 44, fighterJets: 42, aircraftCarriers: 0 },
    approval: 48, stability: 87, budgetBalance: 2.1,
    startingContext: 'Strong pharmaceutical surpluses fund rapid Arctic and Baltic rearmament as Copenhagen navigates diplomatic friction over Greenland’s strategic status.'
  },
  {
    id: '304',
    name: 'Greenland',
    leader: 'Jens-Frederik Nielsen, Prime Minister',
    region: 'North America',
    color: '#c2a8cf',
    sovereignId: '208',
    hatched: true,
    stats: { population: 0.06, gdp: 3.5, unemployment: 3.3, inflation: 2.0, armedForces: 0, tanks: 0, fighterJets: 0, aircraftCarriers: 0 },
    approval: 61, stability: 82, budgetBalance: 0.3,
    startingContext: 'Autonomous territory of the Kingdom of Denmark charting a measured path on critical-mineral investment, Arctic security cooperation, and long-term self-determination.'
  },
  {
    id: '756',
    name: 'Switzerland',
    leader: 'Guy Parmelin, President',
    region: 'Europe',
    color: '#d4a6aa',
    stats: { population: 9.1, gdp: 975, unemployment: 2.7, inflation: 0.8, armedForces: 21000, tanks: 134, fighterJets: 30, aircraftCarriers: 0 },
    approval: 65, stability: 92, budgetBalance: 0.4,
    startingContext: 'Advancing updated bilateral agreements with the European Union while managing a strong franc and debates over defense neutrality rules.'
  },
  {
    id: '040',
    name: 'Austria',
    leader: 'Christian Stocker, Chancellor',
    region: 'Europe',
    color: '#d1b5a8',
    stats: { population: 9.2, gdp: 552, unemployment: 5.5, inflation: 2.4, armedForces: 22500, tanks: 56, fighterJets: 15, aircraftCarriers: 0 },
    approval: 40, stability: 77, budgetBalance: -3.4,
    startingContext: 'Vienna’s centrist coalition works to restore fiscal discipline and industrial competitiveness after transitioning away from Russian pipeline gas.'
  },
  {
    id: '348',
    name: 'Hungary',
    leader: 'Viktor Orbán, Prime Minister',
    region: 'Europe',
    color: '#cfc09b',
    stats: { population: 9.6, gdp: 241, unemployment: 4.3, inflation: 4.1, armedForces: 42000, tanks: 120, fighterJets: 14, aircraftCarriers: 0 },
    approval: 43, stability: 69, budgetBalance: -4.2,
    startingContext: 'Heading into a tightly contested spring 2026 parliamentary election while balancing EU fund negotiations with Chinese EV and battery manufacturing investments.'
  },
  {
    id: '203',
    name: 'Czechia',
    leader: 'Andrej Babiš, Prime Minister',
    region: 'Europe',
    color: '#b0c9bc',
    stats: { population: 10.9, gdp: 358, unemployment: 2.9, inflation: 2.3, armedForces: 28500, tanks: 54, fighterJets: 14, aircraftCarriers: 0 },
    approval: 44, stability: 79, budgetBalance: -2.9,
    startingContext: 'Low unemployment and expanding nuclear-energy projects underpin Central Europe’s industrial heartland following autumn 2025 elections.'
  },
  {
    id: '642',
    name: 'Romania',
    leader: 'Nicușor Dan, President',
    region: 'Europe',
    color: '#bcc9a4',
    stats: { population: 19.0, gdp: 402, unemployment: 5.3, inflation: 4.3, armedForces: 82000, tanks: 377, fighterJets: 38, aircraftCarriers: 0 },
    approval: 51, stability: 71, budgetBalance: -6.8,
    startingContext: 'Bucharest is tightening fiscal policy to narrow its deficit while expanding Black Sea offshore gas production and NATO air-base capacity.'
  },
  {
    id: '300',
    name: 'Greece',
    leader: 'Kyriakos Mitsotakis, Prime Minister',
    region: 'Europe',
    color: '#a3bfd4',
    stats: { population: 10.4, gdp: 266, unemployment: 8.9, inflation: 2.4, armedForces: 142700, tanks: 1228, fighterJets: 232, aircraftCarriers: 0 },
    approval: 44, stability: 76, budgetBalance: -0.5,
    startingContext: 'Sustained primary surpluses, booming maritime and tourism revenue, and modernized Rafale/frigate forces strengthen Athens’ Mediterranean standing.'
  },
  {
    id: '620',
    name: 'Portugal',
    leader: 'Luís Montenegro, Prime Minister',
    region: 'Europe',
    color: '#adc9b0',
    stats: { population: 10.7, gdp: 318, unemployment: 6.2, inflation: 2.2, armedForces: 24500, tanks: 37, fighterJets: 25, aircraftCarriers: 0 },
    approval: 46, stability: 77, budgetBalance: 0.3,
    startingContext: 'Sustaining budget surpluses and clean-energy investment while addressing urban housing pressures and digital-services growth.'
  },
  {
    id: '056',
    name: 'Belgium',
    leader: 'Bart De Wever, Prime Minister',
    region: 'Europe',
    color: '#d4c89e',
    stats: { population: 11.8, gdp: 685, unemployment: 5.6, inflation: 2.6, armedForces: 26000, tanks: 0, fighterJets: 45, aircraftCarriers: 0 },
    approval: 44, stability: 76, budgetBalance: -4.2,
    startingContext: 'Implementing multi-year pension and labor reforms to narrow Belgium’s deficit while hosting EU and NATO institutions and raising defense budgets.'
  },
  {
    id: '372',
    name: 'Ireland',
    leader: 'Micheál Martin, Taoiseach',
    region: 'Europe',
    color: '#b0ccae',
    stats: { population: 5.4, gdp: 590, unemployment: 4.2, inflation: 1.8, armedForces: 7800, tanks: 0, fighterJets: 0, aircraftCarriers: 0 },
    approval: 48, stability: 85, budgetBalance: 3.1,
    startingContext: 'Channeling corporate-tax surpluses into housing, grid upgrades, and a sovereign fund while hedging against U.S. pharma and tax-policy shifts.'
  },
  {
    id: '704',
    name: 'Vietnam',
    leader: 'Tô Lâm, General Secretary',
    region: 'Asia',
    color: '#d4afa8',
    stats: { population: 101.0, gdp: 505, unemployment: 2.2, inflation: 3.3, armedForces: 482000, tanks: 1379, fighterJets: 72, aircraftCarriers: 0 },
    approval: 71, stability: 79, budgetBalance: -3.1,
    startingContext: 'Rapid electronics and semiconductor assembly growth powers nearly 7% expansion as Hanoi streamlines state ministries and negotiates trade balance with Washington.'
  },
  {
    id: '764',
    name: 'Thailand',
    leader: 'Anutin Charnvirakul, Prime Minister',
    region: 'Asia',
    color: '#bcb3cf',
    stats: { population: 71.7, gdp: 548, unemployment: 1.1, inflation: 1.5, armedForces: 360850, tanks: 635, fighterJets: 72, aircraftCarriers: 1 },
    approval: 48, stability: 68, budgetBalance: -3.4,
    startingContext: 'Boosting tourism, data-center investment, and EV assembly while working down elevated household debt across Southeast Asia’s second-largest economy.'
  },
  {
    id: '608',
    name: 'Philippines',
    leader: 'Ferdinand Marcos Jr., President',
    region: 'Asia',
    color: '#a8c2cf',
    stats: { population: 120.4, gdp: 506, unemployment: 3.8, inflation: 2.7, armedForces: 152000, tanks: 18, fighterJets: 16, aircraftCarriers: 0 },
    approval: 53, stability: 67, budgetBalance: -5.0,
    startingContext: 'Robust 6% growth pairs with deepening U.S., Japanese, and Australian maritime defense partnerships amid persistent South China Sea friction.'
  },
  {
    id: '458',
    name: 'Malaysia',
    leader: 'Anwar Ibrahim, Prime Minister',
    region: 'Asia',
    color: '#cfc09f',
    stats: { population: 35.0, gdp: 468, unemployment: 3.1, inflation: 2.1, armedForces: 113000, tanks: 48, fighterJets: 26, aircraftCarriers: 0 },
    approval: 54, stability: 76, budgetBalance: -3.8,
    startingContext: 'Capitalizing on booming chip-packaging and AI data-center corridors in Penang and Johor while balancing Western and Chinese investment flows.'
  },
  {
    id: '050',
    name: 'Bangladesh',
    leader: 'Muhammad Yunus, Chief Adviser',
    region: 'Asia',
    color: '#aec9b3',
    stats: { population: 175.2, gdp: 472, unemployment: 4.7, inflation: 8.4, armedForces: 163050, tanks: 320, fighterJets: 44, aircraftCarriers: 0 },
    approval: 54, stability: 56, budgetBalance: -4.3,
    startingContext: 'Preparing for national elections while stabilizing banking-sector governance, garment export competitiveness, and foreign-exchange reserves.'
  },
  {
    id: '784',
    name: 'United Arab Emirates',
    leader: 'Mohamed bin Zayed Al Nahyan, President',
    region: 'Middle East',
    color: '#a3c9c2',
    stats: { population: 10.9, gdp: 576, unemployment: 2.6, inflation: 2.0, armedForces: 65000, tanks: 354, fighterJets: 138, aircraftCarriers: 0 },
    approval: 78, stability: 87, budgetBalance: 4.5,
    startingContext: 'Scaling sovereign AI compute clusters, global port corridors, and clean-energy finance while sustaining pragmatic commercial links worldwide.'
  },
  {
    id: '634',
    name: 'Qatar',
    leader: 'Tamim bin Hamad Al Thani, Emir',
    region: 'Middle East',
    color: '#cfaab8',
    stats: { population: 3.1, gdp: 234, unemployment: 0.2, inflation: 1.4, armedForces: 16500, tanks: 62, fighterJets: 96, aircraftCarriers: 0 },
    approval: 77, stability: 85, budgetBalance: 4.9,
    startingContext: 'Bringing first waves of North Field LNG expansion online while serving as a high-profile diplomatic mediator across the Middle East.'
  },
  {
    id: '368',
    name: 'Iraq',
    leader: "Mohammed Shia' Al Sudani, Prime Minister",
    region: 'Middle East',
    color: '#c9bc9e',
    stats: { population: 47.0, gdp: 278, unemployment: 15.1, inflation: 3.0, armedForces: 193000, tanks: 391, fighterJets: 34, aircraftCarriers: 0 },
    approval: 49, stability: 54, budgetBalance: -4.9,
    startingContext: 'Advancing the Development Road rail corridor and power-grid upgrades while managing post-election coalition talks and regional security balances.'
  },
  {
    id: '760',
    name: 'Syria',
    leader: 'Ahmed al-Sharaa, Transitional President',
    region: 'Middle East',
    color: '#c2aec4',
    stats: { population: 24.8, gdp: 26, unemployment: 19.5, inflation: 34.0, armedForces: 105000, tanks: 400, fighterJets: 24, aircraftCarriers: 0 },
    approval: 55, stability: 40, budgetBalance: -8.2,
    startingContext: 'One year after the fall of the Assad regime, Damascus is consolidating state institutions, negotiating gradual sanctions relief, and courting Gulf and Turkish reconstruction capital.'
  },
  {
    id: '170',
    name: 'Colombia',
    leader: 'Gustavo Petro, President',
    region: 'South America',
    color: '#adc9b4',
    stats: { population: 53.4, gdp: 432, unemployment: 9.5, inflation: 4.8, armedForces: 293200, tanks: 0, fighterJets: 21, aircraftCarriers: 0 },
    approval: 35, stability: 61, budgetBalance: -5.2,
    startingContext: 'Entering a May 2026 presidential election amid debates over fiscal rules, energy policy, rural security, and trade diplomacy with Washington.'
  },
  {
    id: '152',
    name: 'Chile',
    leader: 'José Antonio Kast, President-elect',
    region: 'South America',
    color: '#a3bccc',
    stats: { population: 19.8, gdp: 348, unemployment: 8.0, inflation: 3.8, armedForces: 80000, tanks: 246, fighterJets: 46, aircraftCarriers: 0 },
    approval: 51, stability: 77, budgetBalance: -2.2,
    startingContext: 'Preparing for a March 2026 presidential handover with strong copper and lithium export demand and heightened voter focus on public security and investment permitting.'
  },
  {
    id: '604',
    name: 'Peru',
    leader: 'Dina Boluarte, President',
    region: 'South America',
    color: '#ccb1be',
    stats: { population: 34.6, gdp: 298, unemployment: 6.2, inflation: 2.1, armedForces: 81000, tanks: 140, fighterJets: 29, aircraftCarriers: 0 },
    approval: 14, stability: 56, budgetBalance: -2.8,
    startingContext: 'Heading toward April 2026 general elections with surging Pacific trade via the Chancay megaport and low inflation offsetting political fragmentation.'
  },
  {
    id: '862',
    name: 'Venezuela',
    leader: 'Nicolás Maduro, President',
    region: 'South America',
    color: '#d4b3a6',
    stats: { population: 28.5, gdp: 112, unemployment: 5.9, inflation: 44.0, armedForces: 109000, tanks: 173, fighterJets: 36, aircraftCarriers: 0 },
    approval: 24, stability: 44, budgetBalance: -6.0,
    startingContext: 'Managing tight oil-sanctions constraints, heavy migration outflows, and geopolitical alignment with Moscow, Beijing, and Tehran.'
  },
  {
    id: '398',
    name: 'Kazakhstan',
    leader: 'Kassym-Jomart Tokayev, President',
    region: 'Central Asia',
    color: '#bcc9a2',
    stats: { population: 20.5, gdp: 312, unemployment: 4.6, inflation: 7.9, armedForces: 110000, tanks: 300, fighterJets: 110, aircraftCarriers: 0 },
    approval: 63, stability: 75, budgetBalance: -2.5,
    startingContext: 'Expanding Trans-Caspian trade corridors, uranium output, and multi-vector diplomacy connecting Europe, China, and Russia.'
  },
  {
    id: '112',
    name: 'Belarus',
    leader: 'Alexander Lukashenko, President',
    region: 'Europe',
    color: '#b8c7a3',
    stats: { population: 9.1, gdp: 76, unemployment: 3.4, inflation: 5.4, armedForces: 63000, tanks: 532, fighterJets: 42, aircraftCarriers: 0 },
    approval: 42, stability: 63, budgetBalance: -1.8,
    startingContext: 'Deeply integrated into Russia’s Union State defense and trade architecture while operating under Western sanctions.'
  },
  {
    id: '554',
    name: 'New Zealand',
    leader: 'Christopher Luxon, Prime Minister',
    region: 'Oceania',
    color: '#b3c9ab',
    stats: { population: 5.3, gdp: 268, unemployment: 5.0, inflation: 2.1, armedForces: 9200, tanks: 0, fighterJets: 0, aircraftCarriers: 0 },
    approval: 44, stability: 87, budgetBalance: -2.3,
    startingContext: 'Entering a 2026 election year as lower interest rates revive growth while Wellington upgrades maritime patrol and Pacific diplomacy.'
  },
  {
    id: '012',
    name: 'Algeria',
    leader: 'Abdelmadjid Tebboune, President',
    region: 'Africa',
    color: '#a8c7bc',
    stats: { population: 47.4, gdp: 276, unemployment: 11.2, inflation: 4.1, armedForces: 130000, tanks: 1485, fighterJets: 106, aircraftCarriers: 0 },
    approval: 54, stability: 69, budgetBalance: -5.0,
    startingContext: 'Anchoring European natural-gas supply while maintaining North Africa’s largest defense posture and managing Sahel border pressures.'
  },
  {
    id: '504',
    name: 'Morocco',
    leader: 'King Mohammed VI',
    region: 'Africa',
    color: '#d1b0ab',
    stats: { population: 38.5, gdp: 165, unemployment: 12.6, inflation: 1.6, armedForces: 195800, tanks: 656, fighterJets: 83, aircraftCarriers: 0 },
    approval: 66, stability: 77, budgetBalance: -3.8,
    startingContext: 'Accelerating high-speed rail, desalination, and stadium infrastructure ahead of the 2030 World Cup alongside booming auto and green-hydrogen exports.'
  },
  {
    id: '231',
    name: 'Ethiopia',
    leader: 'Abiy Ahmed, Prime Minister',
    region: 'Africa',
    color: '#cfc2a2',
    stats: { population: 135.2, gdp: 158, unemployment: 4.0, inflation: 15.0, armedForces: 162000, tanks: 375, fighterJets: 20, aircraftCarriers: 0 },
    approval: 48, stability: 49, budgetBalance: -2.8,
    startingContext: 'Harnessing full hydropower generation from the Renaissance Dam and IMF-backed market reforms while managing internal security and Red Sea access diplomacy.'
  },
  {
    id: '404',
    name: 'Kenya',
    leader: 'William Ruto, President',
    region: 'Africa',
    color: '#aec9b0',
    stats: { population: 57.5, gdp: 124, unemployment: 5.5, inflation: 3.6, armedForces: 24100, tanks: 78, fighterJets: 17, aircraftCarriers: 0 },
    approval: 40, stability: 62, budgetBalance: -4.6,
    startingContext: 'East Africa’s fintech and green-geothermal leader balancing debt-service consolidation with broad-based coalition governance.'
  },
  {
    id: '192',
    name: 'Cuba',
    leader: 'Miguel Díaz-Canel, President',
    region: 'Caribbean',
    color: '#c2b0cc',
    stats: { population: 10.8, gdp: 108, unemployment: 1.7, inflation: 29.0, armedForces: 49000, tanks: 790, fighterJets: 38, aircraftCarriers: 0 },
    approval: 27, stability: 45, budgetBalance: -10.8,
    startingContext: 'Struggling with aging power-grid reliability, hard-currency shortages, and tightened sanctions pressure.'
  },
  {
    id: '004',
    name: 'Afghanistan',
    leader: 'Hibatullah Akhundzada, Supreme Leader',
    region: 'Asia',
    color: '#c4b4aa',
    stats: { population: 43.6, gdp: 18, unemployment: 14.0, inflation: 1.5, armedForces: 150000, tanks: 50, fighterJets: 0, aircraftCarriers: 0 },
    approval: 39, stability: 44, budgetBalance: -2.0,
  },
  {
    id: '104',
    name: 'Myanmar',
    leader: 'Min Aung Hlaing, Senior General',
    region: 'Asia',
    color: '#ccb0ba',
    stats: { population: 54.9, gdp: 63, unemployment: 3.2, inflation: 24.0, armedForces: 145000, tanks: 180, fighterJets: 67, aircraftCarriers: 0 },
    approval: 18, stability: 27, budgetBalance: -6.5,
  },
  {
    id: '180',
    name: 'Dem. Rep. Congo',
    mapName: 'Dem. Rep. Congo',
    leader: 'Félix Tshisekedi, President',
    region: 'Africa',
    color: '#b3c9b0',
    stats: { population: 112.5, gdp: 78, unemployment: 4.5, inflation: 12.5, armedForces: 135000, tanks: 175, fighterJets: 7, aircraftCarriers: 0 },
    approval: 43, stability: 36, budgetBalance: -2.7,
  },
  {
    id: '729',
    name: 'Sudan',
    leader: 'Abdel Fattah al-Burhan, Sovereign Council Chair',
    region: 'Africa',
    color: '#d1aea6',
    stats: { population: 51.5, gdp: 31, unemployment: 21.5, inflation: 110.0, armedForces: 105000, tanks: 170, fighterJets: 45, aircraftCarriers: 0 },
    approval: 30, stability: 23, budgetBalance: -11.0,
  },
  {
    id: '887',
    name: 'Yemen',
    leader: 'Rashad al-Alimi, Presidential Council Chair',
    region: 'Middle East',
    color: '#d1aba8',
    stats: { population: 41.5, gdp: 20, unemployment: 17.2, inflation: 15.0, armedForces: 66700, tanks: 150, fighterJets: 20, aircraftCarriers: 0 },
    approval: 31, stability: 25, budgetBalance: -8.2,
  },
  {
    id: '422',
    name: 'Lebanon',
    leader: 'Joseph Aoun, President',
    region: 'Middle East',
    color: '#b8c9b4',
    stats: { population: 5.8, gdp: 23, unemployment: 11.5, inflation: 14.0, armedForces: 62000, tanks: 334, fighterJets: 0, aircraftCarriers: 0 },
    approval: 57, stability: 46, budgetBalance: -3.0,
  },
  {
    id: '400',
    name: 'Jordan',
    leader: 'King Abdullah II',
    region: 'Middle East',
    color: '#bfc7ab',
    stats: { population: 11.7, gdp: 55, unemployment: 20.8, inflation: 2.0, armedForces: 100500, tanks: 447, fighterJets: 44, aircraftCarriers: 0 },
    approval: 61, stability: 71, budgetBalance: -4.9,
  },
  {
    id: '414',
    name: 'Kuwait',
    leader: 'Meshal Al-Ahmad Al-Jaber Al-Sabah, Emir',
    region: 'Middle East',
    color: '#a8c7c0',
    stats: { population: 5.0, gdp: 168, unemployment: 2.1, inflation: 2.6, armedForces: 17500, tanks: 293, fighterJets: 67, aircraftCarriers: 0 },
    approval: 64, stability: 79, budgetBalance: -1.3,
  },
  {
    id: '512',
    name: 'Oman',
    leader: 'Haitham bin Tariq, Sultan',
    region: 'Middle East',
    color: '#c7bea8',
    stats: { population: 5.4, gdp: 114, unemployment: 3.0, inflation: 1.2, armedForces: 42600, tanks: 117, fighterJets: 35, aircraftCarriers: 0 },
    approval: 74, stability: 84, budgetBalance: 2.0,
  },
  { id: '860', name: 'Uzbekistan', leader: 'Shavkat Mirziyoyev, President', region: 'Central Asia', stats: { population: 37.9, gdp: 122, unemployment: 6.5, inflation: 8.6, armedForces: 48000, tanks: 340, fighterJets: 58, aircraftCarriers: 0 } },
  { id: '031', name: 'Azerbaijan', leader: 'Ilham Aliyev, President', region: 'Caucasus', stats: { population: 10.3, gdp: 79, unemployment: 5.3, inflation: 3.4, armedForces: 126400, tanks: 506, fighterJets: 16, aircraftCarriers: 0 } },
  { id: '268', name: 'Georgia', leader: 'Irakli Kobakhidze, Prime Minister', region: 'Caucasus', stats: { population: 3.7, gdp: 35, unemployment: 13.4, inflation: 2.3, armedForces: 20650, tanks: 123, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '051', name: 'Armenia', leader: 'Nikol Pashinyan, Prime Minister', region: 'Caucasus', stats: { population: 3.0, gdp: 28, unemployment: 12.6, inflation: 2.0, armedForces: 42900, tanks: 109, fighterJets: 4, aircraftCarriers: 0 } },
  { id: '100', name: 'Bulgaria', leader: 'Rosen Zhelyazkov, Prime Minister', region: 'Europe', stats: { population: 6.4, gdp: 114, unemployment: 4.0, inflation: 2.4, armedForces: 37000, tanks: 90, fighterJets: 14, aircraftCarriers: 0 } },
  { id: '688', name: 'Serbia', leader: 'Aleksandar Vučić, President', region: 'Europe', stats: { population: 6.6, gdp: 88, unemployment: 8.4, inflation: 3.9, armedForces: 28150, tanks: 242, fighterJets: 14, aircraftCarriers: 0 } },
  { id: '191', name: 'Croatia', leader: 'Andrej Plenković, Prime Minister', region: 'Europe', stats: { population: 3.9, gdp: 95, unemployment: 4.8, inflation: 3.0, armedForces: 14500, tanks: 75, fighterJets: 12, aircraftCarriers: 0 } },
  { id: '703', name: 'Slovakia', leader: 'Robert Fico, Prime Minister', region: 'Europe', stats: { population: 5.4, gdp: 148, unemployment: 5.2, inflation: 3.0, armedForces: 19500, tanks: 45, fighterJets: 6, aircraftCarriers: 0 } },
  { id: '705', name: 'Slovenia', leader: 'Robert Golob, Prime Minister', region: 'Europe', stats: { population: 2.1, gdp: 76, unemployment: 3.5, inflation: 2.1, armedForces: 6900, tanks: 46, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '440', name: 'Lithuania', leader: 'Gintautas Paluckas, Prime Minister', region: 'Europe', stats: { population: 2.9, gdp: 88, unemployment: 6.9, inflation: 2.2, armedForces: 23500, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '428', name: 'Latvia', leader: 'Evika Siliņa, Prime Minister', region: 'Europe', stats: { population: 1.9, gdp: 47, unemployment: 6.5, inflation: 2.2, armedForces: 18000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '233', name: 'Estonia', leader: 'Kristen Michal, Prime Minister', region: 'Europe', stats: { population: 1.4, gdp: 45, unemployment: 7.2, inflation: 3.1, armedForces: 7900, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '352', name: 'Iceland', leader: 'Kristrún Frostadóttir, Prime Minister', region: 'Europe', stats: { population: 0.4, gdp: 35, unemployment: 3.5, inflation: 3.8, armedForces: 0, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '442', name: 'Luxembourg', leader: 'Luc Frieden, Prime Minister', region: 'Europe', stats: { population: 0.7, gdp: 95, unemployment: 5.7, inflation: 1.9, armedForces: 900, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '196', name: 'Cyprus', leader: 'Nikos Christodoulides, President', region: 'Europe', stats: { population: 0.9, gdp: 37, unemployment: 4.7, inflation: 2.1, armedForces: 12000, tanks: 82, fighterJets: 0, aircraftCarriers: 0 } },
  { id: 'NCY', name: 'Northern Cyprus', mapName: 'N. Cyprus', leader: 'Tufan Erhürman, President', region: 'Europe', sovereignId: '792', hatched: true, stats: { population: 0.4, gdp: 5.0, unemployment: 6.0, inflation: 32.0, armedForces: 5000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '498', name: 'Moldova', leader: 'Maia Sandu, President', region: 'Europe', stats: { population: 2.4, gdp: 19, unemployment: 4.1, inflation: 5.4, armedForces: 6500, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '008', name: 'Albania', leader: 'Edi Rama, Prime Minister', region: 'Europe', stats: { population: 2.7, gdp: 28, unemployment: 10.2, inflation: 2.2, armedForces: 8500, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '070', name: 'Bosnia and Herzegovina', mapName: 'Bosnia and Herz.', leader: 'Borjana Krišto, Chairwoman', region: 'Europe', stats: { population: 3.2, gdp: 30, unemployment: 12.8, inflation: 2.3, armedForces: 10500, tanks: 45, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '807', name: 'North Macedonia', mapName: 'Macedonia', leader: 'Hristijan Mickoski, Prime Minister', region: 'Europe', stats: { population: 1.8, gdp: 17, unemployment: 12.1, inflation: 3.2, armedForces: 8000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '499', name: 'Montenegro', leader: 'Milojko Spajić, Prime Minister', region: 'Europe', stats: { population: 0.6, gdp: 8.5, unemployment: 11.0, inflation: 2.7, armedForces: 2350, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: 'KOS', name: 'Kosovo', mapName: 'Kosovo', leader: 'Albin Kurti, Prime Minister', region: 'Europe', stats: { population: 1.6, gdp: 11.6, unemployment: 10.6, inflation: 2.0, armedForces: 4200, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '275', name: 'Palestine', leader: 'Mahmoud Abbas, President', region: 'Middle East', hatched: true, stats: { population: 5.6, gdp: 15, unemployment: 38.0, inflation: 14.0, armedForces: 0, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '732', name: 'Western Sahara', mapName: 'W. Sahara', leader: 'Brahim Ghali, President (SADR)', region: 'Africa', sovereignId: '504', hatched: true, stats: { population: 0.6, gdp: 1.0, unemployment: 18.0, inflation: 2.5, armedForces: 6000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: 'SML', name: 'Somaliland', mapName: 'Somaliland', leader: 'Abdirahman Mohamed Abdullahi, President', region: 'Africa', hatched: true, stats: { population: 4.6, gdp: 3.8, unemployment: 27.0, inflation: 6.2, armedForces: 15000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '630', name: 'Puerto Rico', leader: 'Jenniffer González-Colón, Governor', region: 'Caribbean', sovereignId: '840', hatched: true, stats: { population: 3.2, gdp: 124, unemployment: 5.4, inflation: 2.3, armedForces: 0, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '238', name: 'Falkland Islands', mapName: 'Falkland Is.', leader: 'Alison Blake, Governor', region: 'South America', sovereignId: '826', hatched: true, stats: { population: 0.004, gdp: 0.3, unemployment: 1.0, inflation: 2.4, armedForces: 1200, tanks: 0, fighterJets: 4, aircraftCarriers: 0 } },
  { id: '540', name: 'New Caledonia', leader: 'Alcide Ponga, President', region: 'Oceania', sovereignId: '250', hatched: true, stats: { population: 0.27, gdp: 9.8, unemployment: 11.0, inflation: 2.3, armedForces: 0, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '144', name: 'Sri Lanka', leader: 'Anura Kumara Dissanayake, President', region: 'Asia', stats: { population: 21.9, gdp: 91, unemployment: 4.5, inflation: 2.4, armedForces: 200000, tanks: 62, fighterJets: 7, aircraftCarriers: 0 } },
  { id: '524', name: 'Nepal', leader: 'KP Sharma Oli, Prime Minister', region: 'Asia', stats: { population: 31.2, gdp: 45, unemployment: 10.5, inflation: 4.6, armedForces: 96000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '064', name: 'Bhutan', leader: 'Tshering Tobgay, Prime Minister', region: 'Asia', stats: { population: 0.8, gdp: 3.3, unemployment: 3.4, inflation: 3.5, armedForces: 8000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '496', name: 'Mongolia', leader: 'Luvsannamsrain Oyun-Erdene, Prime Minister', region: 'Asia', stats: { population: 3.5, gdp: 25, unemployment: 5.3, inflation: 6.8, armedForces: 9700, tanks: 470, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '116', name: 'Cambodia', leader: 'Hun Manet, Prime Minister', region: 'Asia', stats: { population: 17.8, gdp: 49, unemployment: 0.4, inflation: 2.3, armedForces: 124300, tanks: 200, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '418', name: 'Laos', leader: 'Sonexay Siphandone, Prime Minister', region: 'Asia', stats: { population: 7.9, gdp: 17, unemployment: 1.2, inflation: 14.0, armedForces: 29100, tanks: 55, fighterJets: 4, aircraftCarriers: 0 } },
  { id: '096', name: 'Brunei', leader: 'Hassanal Bolkiah, Sultan', region: 'Asia', stats: { population: 0.46, gdp: 16.2, unemployment: 5.0, inflation: 0.7, armedForces: 7200, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '626', name: 'Timor-Leste', leader: 'Xanana Gusmão, Prime Minister', region: 'Asia', stats: { population: 1.4, gdp: 2.2, unemployment: 1.6, inflation: 2.9, armedForces: 2280, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '762', name: 'Tajikistan', leader: 'Emomali Rahmon, President', region: 'Central Asia', stats: { population: 10.8, gdp: 14.5, unemployment: 6.9, inflation: 4.3, armedForces: 9500, tanks: 37, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '417', name: 'Kyrgyzstan', leader: 'Sadyr Japarov, President', region: 'Central Asia', stats: { population: 7.3, gdp: 17.4, unemployment: 4.1, inflation: 5.8, armedForces: 10900, tanks: 150, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '795', name: 'Turkmenistan', leader: 'Serdar Berdimuhamedow, President', region: 'Central Asia', stats: { population: 7.6, gdp: 67, unemployment: 4.0, inflation: 5.2, armedForces: 36500, tanks: 654, fighterJets: 24, aircraftCarriers: 0 } },
  { id: '598', name: 'Papua New Guinea', leader: 'James Marape, Prime Minister', region: 'Oceania', stats: { population: 10.8, gdp: 34, unemployment: 2.7, inflation: 3.8, armedForces: 3600, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '242', name: 'Fiji', leader: 'Sitiveni Rabuka, Prime Minister', region: 'Oceania', stats: { population: 0.93, gdp: 6.1, unemployment: 4.3, inflation: 3.0, armedForces: 3500, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '090', name: 'Solomon Islands', mapName: 'Solomon Is.', leader: 'Jeremiah Manele, Prime Minister', region: 'Oceania', stats: { population: 0.84, gdp: 1.8, unemployment: 1.5, inflation: 3.2, armedForces: 0, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '548', name: 'Vanuatu', leader: 'Charlot Salwai, Prime Minister', region: 'Oceania', stats: { population: 0.34, gdp: 1.2, unemployment: 5.1, inflation: 3.8, armedForces: 0, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '858', name: 'Uruguay', leader: 'Yamandú Orsi, President', region: 'South America', stats: { population: 3.4, gdp: 85, unemployment: 7.8, inflation: 5.0, armedForces: 21000, tanks: 15, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '600', name: 'Paraguay', leader: 'Santiago Peña, President', region: 'South America', stats: { population: 7.0, gdp: 47, unemployment: 5.4, inflation: 3.7, armedForces: 13950, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '068', name: 'Bolivia', leader: 'Rodrigo Paz, President', region: 'South America', stats: { population: 12.6, gdp: 50, unemployment: 4.0, inflation: 9.2, armedForces: 34100, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '218', name: 'Ecuador', leader: 'Daniel Noboa, President', region: 'South America', stats: { population: 18.3, gdp: 126, unemployment: 3.6, inflation: 1.6, armedForces: 41250, tanks: 0, fighterJets: 9, aircraftCarriers: 0 } },
  { id: '328', name: 'Guyana', leader: 'Irfaan Ali, President', region: 'South America', stats: { population: 0.84, gdp: 28, unemployment: 11.4, inflation: 3.0, armedForces: 3400, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '740', name: 'Suriname', leader: 'Jennifer Geerlings-Simons, President', region: 'South America', stats: { population: 0.64, gdp: 4.9, unemployment: 7.2, inflation: 9.5, armedForces: 1840, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '591', name: 'Panama', leader: 'José Raúl Mulino, President', region: 'Central America', stats: { population: 4.6, gdp: 91, unemployment: 7.2, inflation: 1.1, armedForces: 0, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '188', name: 'Costa Rica', leader: 'Rodrigo Chaves, President', region: 'Central America', stats: { population: 5.2, gdp: 99, unemployment: 6.7, inflation: 1.2, armedForces: 0, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '558', name: 'Nicaragua', leader: 'Daniel Ortega, President', region: 'Central America', stats: { population: 7.0, gdp: 20, unemployment: 3.4, inflation: 4.0, armedForces: 12000, tanks: 147, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '340', name: 'Honduras', leader: 'Xiomara Castro, President', region: 'Central America', stats: { population: 11.0, gdp: 39, unemployment: 6.1, inflation: 4.1, armedForces: 14950, tanks: 0, fighterJets: 4, aircraftCarriers: 0 } },
  { id: '222', name: 'El Salvador', leader: 'Nayib Bukele, President', region: 'Central America', stats: { population: 6.4, gdp: 38, unemployment: 4.9, inflation: 1.1, armedForces: 24500, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '320', name: 'Guatemala', leader: 'Bernardo Arévalo, President', region: 'Central America', stats: { population: 18.7, gdp: 119, unemployment: 2.5, inflation: 2.6, armedForces: 18050, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '084', name: 'Belize', leader: 'Johnny Briceño, Prime Minister', region: 'Central America', stats: { population: 0.42, gdp: 3.6, unemployment: 3.1, inflation: 2.8, armedForces: 1500, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '214', name: 'Dominican Republic', mapName: 'Dominican Rep.', leader: 'Luis Abinader, President', region: 'Caribbean', stats: { population: 11.5, gdp: 133, unemployment: 5.1, inflation: 3.3, armedForces: 56050, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '332', name: 'Haiti', leader: 'Transitional Presidential Council', region: 'Caribbean', stats: { population: 11.9, gdp: 24, unemployment: 15.2, inflation: 22.0, armedForces: 2000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '388', name: 'Jamaica', leader: 'Andrew Holness, Prime Minister', region: 'Caribbean', stats: { population: 2.8, gdp: 21, unemployment: 4.1, inflation: 4.8, armedForces: 5950, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '044', name: 'Bahamas', leader: 'Philip Davis, Prime Minister', region: 'Caribbean', stats: { population: 0.4, gdp: 15.0, unemployment: 8.6, inflation: 1.9, armedForces: 1600, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '780', name: 'Trinidad and Tobago', leader: 'Kamla Persad-Bissessar, Prime Minister', region: 'Caribbean', stats: { population: 1.5, gdp: 29, unemployment: 4.4, inflation: 1.1, armedForces: 4500, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '788', name: 'Tunisia', leader: 'Kais Saied, President', region: 'Africa', stats: { population: 12.4, gdp: 54, unemployment: 15.8, inflation: 6.0, armedForces: 35800, tanks: 84, fighterJets: 12, aircraftCarriers: 0 } },
  { id: '434', name: 'Libya', leader: 'Abdul Hamid Dbeibeh, Prime Minister', region: 'Africa', stats: { population: 7.5, gdp: 47, unemployment: 18.4, inflation: 2.5, armedForces: 30000, tanks: 120, fighterJets: 16, aircraftCarriers: 0 } },
  { id: '834', name: 'Tanzania', leader: 'Samia Suluhu Hassan, President', region: 'Africa', stats: { population: 70.6, gdp: 86, unemployment: 2.6, inflation: 3.2, armedForces: 27000, tanks: 45, fighterJets: 14, aircraftCarriers: 0 } },
  { id: '800', name: 'Uganda', leader: 'Yoweri Museveni, President', region: 'Africa', stats: { population: 51.4, gdp: 60, unemployment: 2.9, inflation: 3.6, armedForces: 45000, tanks: 240, fighterJets: 10, aircraftCarriers: 0 } },
  { id: '646', name: 'Rwanda', leader: 'Paul Kagame, President', region: 'Africa', stats: { population: 14.6, gdp: 15.9, unemployment: 14.4, inflation: 4.8, armedForces: 33000, tanks: 34, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '108', name: 'Burundi', leader: 'Évariste Ndayishimiye, President', region: 'Africa', stats: { population: 14.4, gdp: 4.3, unemployment: 1.0, inflation: 18.0, armedForces: 30000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '706', name: 'Somalia', leader: 'Hassan Sheikh Mohamud, President', region: 'Africa', stats: { population: 19.6, gdp: 13.6, unemployment: 18.8, inflation: 5.1, armedForces: 19800, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '232', name: 'Eritrea', leader: 'Isaias Afwerki, President', region: 'Africa', stats: { population: 3.6, gdp: 2.7, unemployment: 5.8, inflation: 5.8, armedForces: 201750, tanks: 270, fighterJets: 12, aircraftCarriers: 0 } },
  { id: '262', name: 'Djibouti', leader: 'Ismaïl Omar Guelleh, President', region: 'Africa', stats: { population: 1.2, gdp: 4.7, unemployment: 25.5, inflation: 2.3, armedForces: 10450, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '728', name: 'South Sudan', mapName: 'S. Sudan', leader: 'Salva Kiir Mayardit, President', region: 'Africa', stats: { population: 12.2, gdp: 7.0, unemployment: 12.4, inflation: 38.0, armedForces: 185000, tanks: 110, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '148', name: 'Chad', leader: 'Mahamat Déby, President', region: 'Africa', stats: { population: 20.9, gdp: 19.8, unemployment: 1.1, inflation: 4.5, armedForces: 33250, tanks: 60, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '140', name: 'Central African Republic', mapName: 'Central African Rep.', leader: 'Faustin-Archange Touadéra, President', region: 'Africa', stats: { population: 5.5, gdp: 2.9, unemployment: 6.4, inflation: 4.0, armedForces: 9150, tanks: 3, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '120', name: 'Cameroon', leader: 'Paul Biya, President', region: 'Africa', stats: { population: 29.8, gdp: 56, unemployment: 3.7, inflation: 4.5, armedForces: 25400, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '178', name: 'Republic of the Congo', mapName: 'Congo', leader: 'Denis Sassou Nguesso, President', region: 'Africa', stats: { population: 6.5, gdp: 16.2, unemployment: 19.5, inflation: 3.5, armedForces: 10000, tanks: 41, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '266', name: 'Gabon', leader: 'Brice Oligui Nguema, President', region: 'Africa', stats: { population: 2.6, gdp: 22, unemployment: 19.8, inflation: 2.5, armedForces: 4700, tanks: 0, fighterJets: 6, aircraftCarriers: 0 } },
  { id: '226', name: 'Equatorial Guinea', mapName: 'Eq. Guinea', leader: 'Teodoro Obiang Nguema Mbasogo, President', region: 'Africa', stats: { population: 1.9, gdp: 11.8, unemployment: 8.5, inflation: 3.2, armedForces: 1450, tanks: 3, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '024', name: 'Angola', leader: 'João Lourenço, President', region: 'Africa', stats: { population: 39.0, gdp: 118, unemployment: 14.3, inflation: 21.0, armedForces: 107000, tanks: 300, fighterJets: 62, aircraftCarriers: 0 } },
  { id: '516', name: 'Namibia', leader: 'Netumbo Nandi-Ndaitwah, President', region: 'Africa', stats: { population: 3.1, gdp: 14.2, unemployment: 19.2, inflation: 3.5, armedForces: 9900, tanks: 5, fighterJets: 9, aircraftCarriers: 0 } },
  { id: '072', name: 'Botswana', leader: 'Duma Boko, President', region: 'Africa', stats: { population: 2.6, gdp: 21.4, unemployment: 22.8, inflation: 2.9, armedForces: 9000, tanks: 0, fighterJets: 10, aircraftCarriers: 0 } },
  { id: '716', name: 'Zimbabwe', leader: 'Emmerson Mnangagwa, President', region: 'Africa', stats: { population: 17.0, gdp: 37, unemployment: 8.6, inflation: 19.0, armedForces: 29000, tanks: 40, fighterJets: 10, aircraftCarriers: 0 } },
  { id: '894', name: 'Zambia', leader: 'Hakainde Hichilema, President', region: 'Africa', stats: { population: 21.9, gdp: 31, unemployment: 6.0, inflation: 12.5, armedForces: 15100, tanks: 30, fighterJets: 8, aircraftCarriers: 0 } },
  { id: '454', name: 'Malawi', leader: 'Peter Mutharika, President', region: 'Africa', stats: { population: 22.3, gdp: 11.8, unemployment: 5.0, inflation: 22.0, armedForces: 10700, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '508', name: 'Mozambique', leader: 'Daniel Chapo, President', region: 'Africa', stats: { population: 35.6, gdp: 24.2, unemployment: 3.5, inflation: 4.3, armedForces: 11200, tanks: 60, fighterJets: 8, aircraftCarriers: 0 } },
  { id: '450', name: 'Madagascar', leader: 'Andry Rajoelina, President', region: 'Africa', stats: { population: 32.8, gdp: 18.4, unemployment: 3.0, inflation: 7.0, armedForces: 13500, tanks: 12, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '426', name: 'Lesotho', leader: 'Sam Matekane, Prime Minister', region: 'Africa', stats: { population: 2.3, gdp: 2.4, unemployment: 16.2, inflation: 5.0, armedForces: 2000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '748', name: 'Eswatini', mapName: 'eSwatini', leader: 'King Mswati III', region: 'Africa', stats: { population: 1.2, gdp: 5.3, unemployment: 34.0, inflation: 4.0, armedForces: 3000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '288', name: 'Ghana', leader: 'John Mahama, President', region: 'Africa', stats: { population: 35.1, gdp: 81, unemployment: 3.6, inflation: 17.5, armedForces: 15500, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '384', name: "Côte d'Ivoire", leader: 'Alassane Ouattara, President', region: 'Africa', stats: { population: 32.7, gdp: 93, unemployment: 2.4, inflation: 3.3, armedForces: 27400, tanks: 10, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '686', name: 'Senegal', leader: 'Bassirou Diomaye Faye, President', region: 'Africa', stats: { population: 18.9, gdp: 37, unemployment: 3.0, inflation: 1.9, armedForces: 13600, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '466', name: 'Mali', leader: 'Assimi Goïta, President', region: 'Africa', stats: { population: 25.2, gdp: 23, unemployment: 3.1, inflation: 3.1, armedForces: 21000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '854', name: 'Burkina Faso', leader: 'Ibrahim Traoré, President', region: 'Africa', stats: { population: 24.1, gdp: 23, unemployment: 5.1, inflation: 3.9, armedForces: 11200, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '562', name: 'Niger', leader: 'Abdourahamane Tchiani, President', region: 'Africa', stats: { population: 28.0, gdp: 21, unemployment: 0.5, inflation: 4.8, armedForces: 10000, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '478', name: 'Mauritania', leader: 'Mohamed Ould Ghazouani, President', region: 'Africa', stats: { population: 5.3, gdp: 12, unemployment: 10.2, inflation: 2.7, armedForces: 15850, tanks: 35, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '204', name: 'Benin', leader: 'Patrice Talon, President', region: 'Africa', stats: { population: 14.9, gdp: 23, unemployment: 1.7, inflation: 2.2, armedForces: 7250, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '768', name: 'Togo', leader: 'Faure Gnassingbé, President', region: 'Africa', stats: { population: 9.7, gdp: 10.4, unemployment: 2.0, inflation: 3.3, armedForces: 10000, tanks: 2, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '324', name: 'Guinea', leader: 'Mamady Doumbouya, President', region: 'Africa', stats: { population: 15.2, gdp: 27, unemployment: 5.2, inflation: 5.8, armedForces: 9700, tanks: 38, fighterJets: 3, aircraftCarriers: 0 } },
  { id: '624', name: 'Guinea-Bissau', leader: 'Umaro Sissoco Embaló, President', region: 'Africa', stats: { population: 2.2, gdp: 2.3, unemployment: 2.6, inflation: 4.0, armedForces: 4450, tanks: 10, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '430', name: 'Liberia', leader: 'Joseph Boakai, President', region: 'Africa', stats: { population: 5.7, gdp: 5.1, unemployment: 3.0, inflation: 6.8, armedForces: 2010, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '694', name: 'Sierra Leone', leader: 'Julius Maada Bio, President', region: 'Africa', stats: { population: 8.8, gdp: 4.9, unemployment: 3.2, inflation: 18.0, armedForces: 8500, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
  { id: '270', name: 'Gambia', leader: 'Adama Barrow, President', region: 'Africa', stats: { population: 2.9, gdp: 2.8, unemployment: 6.4, inflation: 9.2, armedForces: 4100, tanks: 0, fighterJets: 0, aircraftCarriers: 0 } },
];

export const COUNTRIES: CountryProfile[] = RAW_COUNTRIES.map((raw) => ({
  id: raw.id,
  name: raw.name,
  mapName: raw.mapName ?? raw.name,
  leader: raw.leader,
  region: raw.region,
  color: raw.color ?? pickColor(raw.id + raw.name),
  sovereignId: raw.sovereignId,
  hatched: raw.hatched ?? false,
  stats: raw.stats,
  governance: {
    approval: raw.approval ?? 50,
    stability: raw.stability ?? 68,
    budgetBalance: raw.budgetBalance ?? -3.2,
  },
  startingContext: raw.startingContext,
}));

export const COUNTRY_BY_ID: Record<string, CountryProfile> = Object.fromEntries(
  COUNTRIES.map((c) => [c.id, c])
);

export const COUNTRY_BY_MAP_NAME: Record<string, CountryProfile> = Object.fromEntries(
  COUNTRIES.map((c) => [c.mapName.toLowerCase(), c])
);

export const COUNTRIES_SORTED: CountryProfile[] = [...COUNTRIES].sort((a, b) =>
  a.name.localeCompare(b.name)
);

export function resolveFeatureCountryId(rawId: string | number | undefined, rawName?: string): string {
  if (rawId !== undefined && rawId !== null && String(rawId).trim() !== '') {
    const padded = String(rawId).padStart(3, '0');
    if (COUNTRY_BY_ID[padded]) return padded;
    if (COUNTRY_BY_ID[String(rawId)]) return String(rawId);
  }
  if (rawName) {
    const lower = rawName.toLowerCase();
    if (lower === 'n. cyprus') return 'NCY';
    if (lower === 'somaliland') return 'SML';
    if (lower === 'kosovo') return 'KOS';
    const match = COUNTRY_BY_MAP_NAME[lower];
    if (match) return match.id;
  }
  return rawId ? String(rawId) : rawName ?? 'UNKNOWN';
}

export function getInitialTerritoryOverrides(): Record<string, TerritoryOverride> {
  const map: Record<string, TerritoryOverride> = {};
  for (const c of COUNTRIES) {
    if (c.hatched && c.sovereignId) {
      const sovereign = COUNTRY_BY_ID[c.sovereignId];
      map[c.id] = {
        targetId: c.id,
        controllerId: c.sovereignId,
        status: 'disputed',
        label: sovereign ? `Autonomous / associated with ${sovereign.name}` : 'Special status territory',
      };
    } else if (c.hatched) {
      map[c.id] = {
        targetId: c.id,
        controllerId: c.id,
        status: 'disputed',
        label: 'Disputed / special status',
      };
    }
  }
  return map;
}

export function getDefaultRelations(countryId: string): DiplomaticRelation[] {
  const presets: Record<string, DiplomaticRelation[]> = {
    '840': [
      { countryId: '826', countryName: 'United Kingdom', status: 'ally', note: 'Special Relationship & NATO' },
      { countryId: '392', countryName: 'Japan', status: 'ally', note: 'Indo-Pacific mutual defense treaty' },
      { countryId: '410', countryName: 'South Korea', status: 'ally', note: 'Mutual defense treaty & chip supply chain' },
      { countryId: '036', countryName: 'Australia', status: 'ally', note: 'ANZUS & AUKUS defense alliance' },
      { countryId: '376', countryName: 'Israel', status: 'ally', note: 'Strategic Middle East defense ally' },
      { countryId: '276', countryName: 'Germany', status: 'ally', note: 'NATO ally & major industrial trade partner' },
      { countryId: '250', countryName: 'France', status: 'ally', note: 'NATO ally & G7 partner' },
      { countryId: '356', countryName: 'India', status: 'partner', note: 'Quad Indo-Pacific & defense-tech partner' },
      { countryId: '682', countryName: 'Saudi Arabia', status: 'partner', note: 'Gulf energy & regional security partner' },
      { countryId: '484', countryName: 'Mexico', status: 'partner', note: 'USMCA neighbor navigating trade review' },
      { countryId: '124', countryName: 'Canada', status: 'tense', note: 'NATO ally navigating tariff friction' },
      { countryId: '156', countryName: 'China', status: 'tense', note: 'Strategic, tariff & technology rivalry' },
      { countryId: '643', countryName: 'Russia', status: 'sanctioned', note: 'Sanctions & Ukraine ceasefire diplomacy' },
      { countryId: '364', countryName: 'Iran', status: 'sanctioned', note: 'Maximum pressure sanctions' },
    ],
    '276': [
      { countryId: '250', countryName: 'France', status: 'ally', note: 'Core EU Franco-German engine & NATO' },
      { countryId: '616', countryName: 'Poland', status: 'ally', note: 'EU, Weimar Triangle & NATO eastern flank' },
      { countryId: '840', countryName: 'United States', status: 'ally', note: 'NATO ally; transatlantic trade friction' },
      { countryId: '826', countryName: 'United Kingdom', status: 'ally', note: 'Trinity House defense pact & NATO' },
      { countryId: '380', countryName: 'Italy', status: 'ally', note: 'EU, G7 & industrial supply partner' },
      { countryId: '528', countryName: 'Netherlands', status: 'ally', note: 'Integrated army units & EU single market' },
      { countryId: '804', countryName: 'Ukraine', status: 'partner', note: 'Major military & financial backer' },
      { countryId: '392', countryName: 'Japan', status: 'partner', note: 'G7 industrial & supply-chain partner' },
      { countryId: '156', countryName: 'China', status: 'partner', note: 'Major export market; de-risking underway' },
      { countryId: '643', countryName: 'Russia', status: 'sanctioned', note: 'EU sanctions & severed gas supply' },
    ],
    '250': [
      { countryId: '276', countryName: 'Germany', status: 'ally', note: 'Core EU engine & defense cooperation' },
      { countryId: '826', countryName: 'United Kingdom', status: 'ally', note: 'Lancaster House nuclear & NATO allies' },
      { countryId: '380', countryName: 'Italy', status: 'ally', note: 'Quirinal Treaty & EU partner' },
      { countryId: '724', countryName: 'Spain', status: 'ally', note: 'EU & Mediterranean defense partner' },
      { countryId: '616', countryName: 'Poland', status: 'ally', note: 'Weimar Triangle & NATO ally' },
      { countryId: '840', countryName: 'United States', status: 'ally', note: 'NATO ally; strategic autonomy debates' },
      { countryId: '356', countryName: 'India', status: 'partner', note: 'Rafale defense & Indo-Pacific partner' },
      { countryId: '804', countryName: 'Ukraine', status: 'partner', note: 'Security & artillery backer' },
      { countryId: '156', countryName: 'China', status: 'partner', note: 'Major trade partner amid EV tariff disputes' },
      { countryId: '643', countryName: 'Russia', status: 'sanctioned', note: 'EU sanctions & Sahel rivalry' },
    ],
    '826': [
      { countryId: '840', countryName: 'United States', status: 'ally', note: 'Special Relationship, Five Eyes & NATO' },
      { countryId: '250', countryName: 'France', status: 'ally', note: 'Entente Cordiale & nuclear defense ally' },
      { countryId: '276', countryName: 'Germany', status: 'ally', note: 'Trinity House defense pact & NATO' },
      { countryId: '036', countryName: 'Australia', status: 'ally', note: 'AUKUS & Five Eyes defense ally' },
      { countryId: '124', countryName: 'Canada', status: 'ally', note: 'Commonwealth, NATO & Five Eyes' },
      { countryId: '392', countryName: 'Japan', status: 'partner', note: 'GCAP fighter program & CPTPP partner' },
      { countryId: '356', countryName: 'India', status: 'partner', note: 'Commonwealth & trade-pact partner' },
      { countryId: '804', countryName: 'Ukraine', status: 'partner', note: '100-year security partnership' },
      { countryId: '643', countryName: 'Russia', status: 'sanctioned', note: 'Severe sanctions over Ukraine war' },
    ],
    '156': [
      { countryId: '586', countryName: 'Pakistan', status: 'ally', note: 'All-weather strategic & CPEC ally' },
      { countryId: '408', countryName: 'North Korea', status: 'ally', note: 'Mutual defense treaty ally' },
      { countryId: '643', countryName: 'Russia', status: 'partner', note: 'Strategic energy & diplomatic partnership' },
      { countryId: '076', countryName: 'Brazil', status: 'partner', note: 'BRICS & major commodities partner' },
      { countryId: '360', countryName: 'Indonesia', status: 'partner', note: 'ASEAN trade, nickel & rail partner' },
      { countryId: '682', countryName: 'Saudi Arabia', status: 'partner', note: 'Major energy & Gulf diplomatic partner' },
      { countryId: '276', countryName: 'Germany', status: 'partner', note: 'Core European manufacturing & trade link' },
      { countryId: '840', countryName: 'United States', status: 'tense', note: 'Tariffs & semiconductor export controls' },
      { countryId: '158', countryName: 'Taiwan', status: 'tense', note: 'Cross-strait sovereignty standoff' },
      { countryId: '356', countryName: 'India', status: 'tense', note: 'Himalayan border vigilance & rivalry' },
    ],
    '643': [
      { countryId: '112', countryName: 'Belarus', status: 'ally', note: 'Union State military & economic ally' },
      { countryId: '408', countryName: 'North Korea', status: 'ally', note: 'Mutual defense treaty & munitions partner' },
      { countryId: '156', countryName: 'China', status: 'partner', note: 'Critical trade, tech & energy lifeline' },
      { countryId: '364', countryName: 'Iran', status: 'partner', note: 'Strategic defense & sanctions cooperation' },
      { countryId: '356', countryName: 'India', status: 'partner', note: 'Major crude oil & defense-legacy buyer' },
      { countryId: '398', countryName: 'Kazakhstan', status: 'partner', note: 'Eurasian Economic Union & CSTO neighbor' },
      { countryId: '804', countryName: 'Ukraine', status: 'war', note: 'Active protracted conflict' },
      { countryId: '840', countryName: 'United States', status: 'sanctioned', note: 'Sanctions & strategic rivalry' },
      { countryId: '276', countryName: 'Germany', status: 'sanctioned', note: 'EU sanctions & energy rupture' },
      { countryId: '826', countryName: 'United Kingdom', status: 'sanctioned', note: 'Sanctions & intelligence rivalry' },
    ],
    '804': [
      { countryId: '616', countryName: 'Poland', status: 'ally', note: 'Primary logistics & defense neighbor' },
      { countryId: '826', countryName: 'United Kingdom', status: 'ally', note: '100-year security partnership' },
      { countryId: '276', countryName: 'Germany', status: 'ally', note: 'Major European defense & financial backer' },
      { countryId: '250', countryName: 'France', status: 'ally', note: 'Bilateral security & Mirage air support' },
      { countryId: '840', countryName: 'United States', status: 'partner', note: 'Key military & diplomatic backer' },
      { countryId: '792', countryName: 'Turkey', status: 'partner', note: 'Black Sea grain corridor & drone partner' },
      { countryId: '643', countryName: 'Russia', status: 'war', note: 'Active war of national defense' },
      { countryId: '112', countryName: 'Belarus', status: 'tense', note: 'Northern border security threat' },
    ],
    '392': [
      { countryId: '840', countryName: 'United States', status: 'ally', note: 'Treaty of Mutual Cooperation & Security' },
      { countryId: '036', countryName: 'Australia', status: 'ally', note: 'Reciprocal Access Agreement & Quad' },
      { countryId: '410', countryName: 'South Korea', status: 'partner', note: 'Trilateral security & semiconductor ties' },
      { countryId: '826', countryName: 'United Kingdom', status: 'partner', note: 'GCAP fighter & Indo-Pacific partner' },
      { countryId: '356', countryName: 'India', status: 'partner', note: 'Quad & infrastructure finance partner' },
      { countryId: '608', countryName: 'Philippines', status: 'partner', note: 'Maritime security & defense aid partner' },
      { countryId: '156', countryName: 'China', status: 'tense', note: 'East China Sea & trade friction' },
      { countryId: '408', countryName: 'North Korea', status: 'sanctioned', note: 'Missile launches & strict sanctions' },
    ],
    '356': [
      { countryId: '250', countryName: 'France', status: 'partner', note: 'Strategic defense, aviation & naval partner' },
      { countryId: '840', countryName: 'United States', status: 'partner', note: 'Quad, tech & Indo-Pacific partner' },
      { countryId: '392', countryName: 'Japan', status: 'partner', note: 'Quad & infrastructure investment partner' },
      { countryId: '643', countryName: 'Russia', status: 'partner', note: 'Longstanding energy & defense supplier' },
      { countryId: '784', countryName: 'United Arab Emirates', status: 'partner', note: 'Trade corridor & Gulf energy partner' },
      { countryId: '376', countryName: 'Israel', status: 'partner', note: 'Defense technology & agriculture partner' },
      { countryId: '156', countryName: 'China', status: 'tense', note: 'Himalayan border & regional rivalry' },
      { countryId: '586', countryName: 'Pakistan', status: 'tense', note: 'Kashmir & cross-border security tensions' },
    ],
    '076': [
      { countryId: '032', countryName: 'Argentina', status: 'ally', note: 'Mercosur core trade & energy partner' },
      { countryId: '858', countryName: 'Uruguay', status: 'ally', note: 'Mercosur regional neighbor' },
      { countryId: '156', countryName: 'China', status: 'partner', note: 'Largest export market & BRICS partner' },
      { countryId: '840', countryName: 'United States', status: 'partner', note: 'Major investor & hemispheric trade link' },
      { countryId: '356', countryName: 'India', status: 'partner', note: 'BRICS & Global South partner' },
      { countryId: '276', countryName: 'Germany', status: 'partner', note: 'EU-Mercosur & industrial climate partner' },
    ],
  };

  if (presets[countryId]) return presets[countryId];

  const c = COUNTRY_BY_ID[countryId];
  if (!c) return [];

  const NATO_EU_CORE = new Set([
    '276', '250', '826', '380', '724', '616', '528', '056', '752', '578',
    '246', '208', '203', '642', '300', '620', '191', '703', '705', '440',
    '428', '233', '100', '352', '442', '008', '499', '807', '124', '792',
  ]);
  const ASEAN_IDS = new Set(['360', '704', '764', '608', '458', '116', '418', '096']);
  const GCC_IDS = new Set(['682', '784', '634', '414', '512']);

  const map = new Map<string, DiplomaticRelation>();
  const add = (id: string, status: DiplomaticRelation['status'], note: string) => {
    if (id === countryId || map.has(id) || !COUNTRY_BY_ID[id]) return;
    map.set(id, { countryId: id, countryName: COUNTRY_BY_ID[id].name, status, note });
  };

  if (NATO_EU_CORE.has(countryId)) {
    add('840', 'ally', 'NATO transatlantic defense ally');
    add('276', 'ally', 'European economic & NATO ally');
    add('250', 'ally', 'European security & NATO ally');
    add('826', 'ally', 'NATO & European defense ally');
    add('616', 'ally', 'NATO eastern flank ally');
    add('804', 'partner', 'Regional security & economic partner');
    add('156', 'partner', 'Major global trading partner');
    add('643', 'sanctioned', 'Sanctions & European security rivalry');
  } else if (ASEAN_IDS.has(countryId)) {
    add('360', 'ally', 'ASEAN regional bloc partner');
    add('458', 'ally', 'ASEAN economic & maritime neighbor');
    add('764', 'ally', 'ASEAN trade & mainland neighbor');
    add('704', 'partner', 'ASEAN manufacturing & trade partner');
    add('840', 'partner', 'Indo-Pacific trade & security partner');
    add('156', 'partner', 'Largest regional trade & investment partner');
    add('392', 'partner', 'Major Asian infrastructure & trade partner');
  } else if (GCC_IDS.has(countryId)) {
    add('682', 'ally', 'GCC collective security & economic ally');
    add('784', 'ally', 'GCC trade & investment ally');
    add('634', 'ally', 'GCC Gulf neighbor');
    add('840', 'partner', 'Strategic defense & energy partner');
    add('156', 'partner', 'Major crude & infrastructure trade partner');
    add('356', 'partner', 'Key energy & labor corridor partner');
    add('364', 'tense', 'Persian Gulf strategic rivalry');
  } else if (c.region === 'Europe') {
    add('276', 'partner', 'Major European economic partner');
    add('250', 'partner', 'European diplomatic & trade partner');
    add('380', 'partner', 'Regional trade & energy partner');
    add('840', 'partner', 'Transatlantic diplomatic partner');
    add('156', 'partner', 'Global trade & investment partner');
    add('643', 'tense', 'Regional geopolitical tension');
  } else if (c.region === 'South America' || c.region === 'Central America' || c.region === 'Caribbean' || c.region === 'North America') {
    add('076', 'partner', 'Regional Latin American economic anchor');
    add('484', 'partner', 'Hemispheric trade & diplomatic partner');
    add('170', 'partner', 'Regional cooperation partner');
    add('840', 'partner', 'Major hemispheric trade & financial partner');
    add('156', 'partner', 'Key commodities & infrastructure partner');
    add('724', 'partner', 'Ibero-American diplomatic & trade link');
  } else if (c.region === 'Middle East') {
    add('682', 'partner', 'Major Gulf economic & diplomatic power');
    add('792', 'partner', 'Regional trade & security actor');
    add('818', 'partner', 'Arab League & regional diplomatic partner');
    add('840', 'partner', 'Global diplomatic & security actor');
    add('156', 'partner', 'Major energy & trade partner');
  } else if (c.region === 'Africa') {
    add('710', 'partner', 'African Union & continental economic hub');
    add('566', 'partner', 'Key West African economic partner');
    add('404', 'partner', 'East African trade & diplomatic partner');
    add('818', 'partner', 'African Union & North African partner');
    add('156', 'partner', 'Major infrastructure & commodities partner');
    add('250', 'partner', 'European trade & development partner');
    add('840', 'partner', 'Global trade & diplomatic partner');
  } else if (c.region === 'Central Asia' || c.region === 'Caucasus') {
    add('398', 'ally', 'Regional corridor & trade neighbor');
    add('792', 'partner', 'Turkic & regional energy corridor partner');
    add('156', 'partner', 'Belt & Road trade and transit partner');
    add('643', 'partner', 'Regional security & trade neighbor');
    add('276', 'partner', 'European energy & trade partner');
  } else {
    // Asia & Oceania fallback
    add('036', 'partner', 'Indo-Pacific regional partner');
    add('392', 'partner', 'Asian economic & investment partner');
    add('356', 'partner', 'South & Indo-Pacific trade partner');
    add('840', 'partner', 'Global trade & security partner');
    add('156', 'partner', 'Major Asian trading partner');
  }

  return Array.from(map.values());
}

/**
 * Instant zero-latency inauguration briefing generator so clicking "Take office"
 * launches straight into GameplayView without waiting on a network roundtrip.
 */
export function buildInstantBriefing(params: {
  country: CountryProfile;
  leaderName: string;
  stats: CountryStats;
  startDisplayDate: string;
  startIsoDate: string;
}): {
  headline: string;
  narrative: string;
  worldHeadlines: WorldHeadline[];
  activeEvents: ActiveCrisis[];
  relations: DiplomaticRelation[];
  suggestedDirectives: string[];
} {
  const { country, leaderName, stats, startDisplayDate, startIsoDate } = params;
  const year = Number(startIsoDate.slice(0, 4)) || 2026;
  const isModernDefault = year >= 2025 && year <= 2027;
  const relations = getDefaultRelations(country.id);

  const baselinePara =
    isModernDefault && country.startingContext
      ? country.startingContext
      : `As of ${startDisplayDate}, ${country.name} enters a defining chapter under ${leaderName}. With a population of ${stats.population} million and a $${Math.round(stats.gdp).toLocaleString('en-US')} billion economy, the cabinet faces immediate choices over fiscal discipline, domestic stability, and strategic alignment across ${country.region}.`;

  const figuresPara = `Treasury briefings place unemployment at ${stats.unemployment.toFixed(1)}% and inflation at ${stats.inflation.toFixed(1)}%, with ${stats.armedForces.toLocaleString('en-US')} active personnel under arms. Ministries are awaiting your first executive directive to set the course of the administration.`;

  const activeEvents: ActiveCrisis[] = [
    {
      id: 'macro-agenda',
      title: stats.inflation >= 6 ? 'Inflation & Cost-of-Living Pressure' : 'Growth & Fiscal Competitiveness',
      severity: stats.inflation >= 8 || stats.unemployment >= 12 ? 'critical' : 'elevated',
      summary: `Headline inflation stands at ${stats.inflation.toFixed(1)}% with unemployment at ${stats.unemployment.toFixed(1)}%; markets and households are watching your opening fiscal stance.`,
    },
    {
      id: 'regional-posture',
      title: `${country.region} Strategic Alignment`,
      severity: relations.some((r) => r.status === 'war') ? 'critical' : 'elevated',
      summary: `Foreign ministries across ${country.region} are signaling early positions on trade tariffs, energy corridors, and mutual defense commitments.`,
    },
  ];

  const worldHeadlines: WorldHeadline[] = [
    {
      dateline: 'GENEVA',
      text: `Global trade monitors warn of tightening industrial tariffs entering ${year}`,
      countryId: '756',
    },
    {
      dateline: country.id === '840' ? 'BRUSSELS' : 'WASHINGTON',
      text:
        country.id === '840'
          ? `European capitals review defense and trade contingencies for ${year}`
          : `Foreign ministries watch ${country.name}’s opening cabinet priorities closely`,
      countryId: country.id === '840' ? '056' : '840',
    },
  ];

  const suggestedDirectives = [
    `Unveil a targeted industrial and energy-modernization package to lift GDP growth while keeping inflation near ${Math.max(2, Math.round(stats.inflation - 0.5))}%.`,
    `Convene a regional trade and security summit with key partners in ${country.region} to strengthen supply chains and diplomatic leverage.`,
    `Audit defense readiness, modernize logistics for our ${stats.armedForces.toLocaleString('en-US')}-strong force, and set clear fiscal targets for the coming year.`,
  ];

  return {
    headline: `${leaderName} takes office in ${country.name}`,
    narrative: `${baselinePara}\n\n${figuresPara}`,
    worldHeadlines,
    activeEvents,
    relations,
    suggestedDirectives,
  };
}
