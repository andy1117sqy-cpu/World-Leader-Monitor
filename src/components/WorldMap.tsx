import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import worldAtlasRaw from 'world-atlas/countries-110m.json';
import { Plus, Minus, RotateCcw, X } from 'lucide-react';
import { COUNTRY_BY_ID, resolveFeatureCountryId } from '../data/countries.ts';
import type {
  DiplomaticRelation,
  MapLayer,
  TerritoryOverride,
} from '../types/game.ts';
import { formatGdp, formatNumber, formatPopulation } from '../utils/format.ts';

interface WorldMapProps {
  selectedCountryId: string | null;
  playerCountryId?: string | null;
  onSelectCountry: (countryId: string) => void;
  territoryOverrides?: Record<string, TerritoryOverride>;
  relations?: DiplomaticRelation[];
  highlightCountryIds?: string[];
  focusCountryId?: string | null;
  mode?: 'lobby' | 'gameplay';
  heightClass?: string;
  onMentionCountry?: (countryName: string) => void;
}

interface MapFeatureItem {
  id: string;
  name: string;
  pathD: string;
  centroid: [number, number];
}

const VIEW_W = 1120;
const VIEW_H = 500;

const RELATION_COLORS: Record<string, string> = {
  ally: '#6fa887',
  partner: '#7aa9bd',
  neutral: '#c8cfd6',
  tense: '#d4ae6a',
  sanctioned: '#cc8b6c',
  war: '#c2696c',
};

const RELATION_LABELS: Record<string, string> = {
  ally: 'Ally',
  partner: 'Partner',
  neutral: 'Neutral',
  tense: 'Tense',
  sanctioned: 'Sanctioned',
  war: 'At war',
};

function getMilitaryFill(countryId: string): string {
  const c = COUNTRY_BY_ID[countryId];
  if (!c) return '#cfd7df';
  const score =
    c.stats.armedForces / 40000 +
    c.stats.tanks / 180 +
    c.stats.fighterJets / 40 +
    c.stats.aircraftCarriers * 18;
  if (score >= 70) return '#9e3b3f';
  if (score >= 30) return '#ba6752';
  if (score >= 12) return '#c99b59';
  if (score >= 4) return '#7da1b5';
  if (score >= 1) return '#a7becb';
  return '#cdd6de';
}

// Compute static world geometry ONCE at module load (zero recomputation across views)
const STATIC_MAP_DATA = (() => {
  const topology = worldAtlasRaw as unknown as Topology<{
    countries: GeometryCollection<{ name?: string }>;
  }>;
  const geojson = feature(topology, topology.objects.countries);

  const projection = geoMercator()
    .scale(152)
    .center([12, 24])
    .translate([VIEW_W / 2, VIEW_H / 2 + 22]);

  const pathGenerator = geoPath(projection);

  const items: MapFeatureItem[] = [];
  for (const f of geojson.features) {
    const rawId = f.id !== undefined ? String(f.id) : undefined;
    const rawName = f.properties?.name;
    if (rawId === '010' || rawId === '260' || rawName === 'Antarctica') {
      continue;
    }
    const d = pathGenerator(f);
    if (!d) continue;
    const id = resolveFeatureCountryId(rawId, rawName);
    const centroid = pathGenerator.centroid(f);
    const profile = COUNTRY_BY_ID[id];
    items.push({
      id,
      name: profile?.name ?? rawName ?? id,
      pathD: d,
      centroid: Number.isFinite(centroid[0]) ? centroid : [VIEW_W / 2, VIEW_H / 2],
    });
  }

  const verticals: number[] = [];
  for (let lon = -160; lon <= 180; lon += 20) {
    const pt = projection([lon, 0]);
    if (pt && pt[0] >= 0 && pt[0] <= VIEW_W) verticals.push(pt[0]);
  }
  const horizontals: number[] = [];
  for (let lat = -50; lat <= 75; lat += 15) {
    const pt = projection([0, lat]);
    if (pt && pt[1] >= 0 && pt[1] <= VIEW_H) horizontals.push(pt[1]);
  }

  return { features: items, gridLines: { verticals, horizontals } };
})();

interface CountryPolygonsProps {
  fills: Record<string, string>;
  activeSelectedId: string | null | undefined;
  playerCountryId: string | null | undefined;
  zoom: number;
}

// Memoized polygon layer so hovering or panning NEVER triggers React re-renders of 175 SVG paths
const CountryPolygons = React.memo<CountryPolygonsProps>(
  ({ fills, activeSelectedId, playerCountryId, zoom }) => {
    const baseStroke = 0.65 / zoom;
    const activeStroke = 1.65 / zoom;

    return (
      <g>
        {STATIC_MAP_DATA.features.map((item) => {
          const isPlayer = item.id === playerCountryId;
          const isSelected = item.id === activeSelectedId;
          const fill = fills[item.id] ?? '#c9d0d6';
          const stroke = isPlayer
            ? '#173a63'
            : isSelected
            ? '#173a63'
            : '#f6f4ef';

          return (
            <path
              key={`${item.id}-${item.name}`}
              data-country-id={item.id}
              d={item.pathD}
              fill={fill}
              stroke={stroke}
              strokeWidth={isPlayer || isSelected ? activeStroke : baseStroke}
              className="cursor-pointer transition-[filter] duration-100 hover:brightness-95"
            />
          );
        })}
      </g>
    );
  }
);

CountryPolygons.displayName = 'CountryPolygons';

function formatTransform(panX: number, panY: number, zoom: number): string {
  return `translate(${VIEW_W / 2 + panX}, ${VIEW_H / 2 + panY}) scale(${zoom}) translate(${-VIEW_W / 2}, ${-VIEW_H / 2})`;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  selectedCountryId,
  playerCountryId,
  onSelectCountry,
  territoryOverrides = {},
  relations = [],
  highlightCountryIds = [],
  focusCountryId,
  mode = 'lobby',
  heightClass = 'h-[420px] sm:h-[460px]',
  onMentionCountry,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const panGroupRef = useRef<SVGGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const livePanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const [isDraggingUI, setIsDraggingUI] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number; moved: boolean } | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const [layer, setLayer] = useState<MapLayer>('political');
  const [inspectedId, setInspectedId] = useState<string | null>(null);

  const relationMap = useMemo(() => {
    const m: Record<string, DiplomaticRelation> = {};
    for (const r of relations) {
      m[r.countryId] = r;
    }
    return m;
  }, [relations]);

  const clampPan = useCallback((nx: number, ny: number, targetZoom: number) => {
    const maxX = ((targetZoom - 1) * VIEW_W) / 2 + 120;
    const maxY = ((targetZoom - 1) * VIEW_H) / 2 + 80;
    return {
      x: Math.max(-maxX, Math.min(maxX, nx)),
      y: Math.max(-maxY, Math.min(maxY, ny)),
    };
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      setZoom((prevZoom) => {
        const nextZoom = Math.max(1, Math.min(7, Number((prevZoom * factor).toFixed(2))));
        setPan((prevPan) => {
          const nextPan =
            nextZoom === 1
              ? { x: 0, y: 0 }
              : clampPan(prevPan.x * (nextZoom / prevZoom), prevPan.y * (nextZoom / prevZoom), nextZoom);
          livePanRef.current = nextPan;
          return nextPan;
        });
        return nextZoom;
      });
    },
    [clampPan]
  );

  const resetView = useCallback(() => {
    setZoom(1);
    livePanRef.current = { x: 0, y: 0 };
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!focusCountryId) return;
    const item = STATIC_MAP_DATA.features.find((f) => f.id === focusCountryId);
    if (!item) return;
    const targetZoom = 2.6;
    const dx = (VIEW_W / 2 - item.centroid[0]) * targetZoom;
    const dy = (VIEW_H / 2 - item.centroid[1]) * targetZoom;
    const nextPan = clampPan(dx, dy, targetZoom);
    livePanRef.current = nextPan;
    setZoom(targetZoom);
    setPan(nextPan);
    if (mode === 'gameplay') {
      setInspectedId(focusCountryId);
    }
  }, [focusCountryId, clampPan, mode]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.18 : 0.85);
    },
    [zoomBy]
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDraggingUI(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: livePanRef.current.x,
      panY: livePanRef.current.y,
      moved: false,
    };
  };

  // Zero React state updates on pointermove for instant 60fps pan & hover tooltip!
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (tooltipRef.current) {
      const tx = Math.min(e.clientX - rect.left + 14, rect.width - 236);
      const ty = Math.max(12, e.clientY - rect.top - 12);
      tooltipRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    }

    if (isDraggingRef.current && dragStartRef.current) {
      const dxScreen = e.clientX - dragStartRef.current.x;
      const dyScreen = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dxScreen, dyScreen) > 4) {
        dragStartRef.current.moved = true;
      }
      const scaleX = VIEW_W / rect.width;
      const scaleY = VIEW_H / rect.height;
      const nextPan = clampPan(
        dragStartRef.current.panX + dxScreen * scaleX,
        dragStartRef.current.panY + dyScreen * scaleY,
        zoom
      );
      livePanRef.current = nextPan;
      if (panGroupRef.current) {
        panGroupRef.current.style.transition = 'none';
        panGroupRef.current.setAttribute('transform', formatTransform(nextPan.x, nextPan.y, zoom));
      }
      return;
    }

    const target = e.target as SVGElement | null;
    const cid = target?.getAttribute('data-country-id') ?? null;
    if (cid !== hoveredIdRef.current) {
      hoveredIdRef.current = cid;
      setHoveredId(cid);
    }
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDraggingUI(false);
      setPan({ ...livePanRef.current });
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragStartRef.current?.moved) return;
    const target = e.target as SVGElement | null;
    const cid = target?.getAttribute('data-country-id');
    if (!cid || !COUNTRY_BY_ID[cid]) return;
    if (mode === 'lobby') {
      onSelectCountry(cid);
    } else {
      setInspectedId((prev) => (prev === cid ? null : cid));
      onSelectCountry(cid);
    }
  };

  const { fills, hatchPatterns } = useMemo(() => {
    const colorSet = new Map<string, string>();
    const fillMap: Record<string, string> = {};

    for (const item of STATIC_MAP_DATA.features) {
      const id = item.id;
      const profile = COUNTRY_BY_ID[id];
      const override = territoryOverrides[id];

      if (mode === 'gameplay' && layer === 'diplomatic') {
        if (id === playerCountryId) {
          fillMap[id] = '#173a63';
        } else if (override && override.controllerId === playerCountryId) {
          if (override.status === 'annexed' || override.status === 'union') {
            fillMap[id] = '#2b598c';
          } else {
            const patId = 'hatch-173a63';
            colorSet.set(patId, '#2b598c');
            fillMap[id] = `url(#${patId})`;
          }
        } else {
          const rel = relationMap[id];
          fillMap[id] = rel ? RELATION_COLORS[rel.status] ?? '#c8cfd6' : '#d5dce2';
        }
        continue;
      }

      if (mode === 'gameplay' && layer === 'military') {
        fillMap[id] = getMilitaryFill(id);
        continue;
      }

      // Political Printed Diplomatic Atlas layer
      if (override) {
        const controllerColor = COUNTRY_BY_ID[override.controllerId]?.color ?? profile?.color ?? '#c2c9d1';
        if (override.status === 'annexed' || override.status === 'union') {
          fillMap[id] = controllerColor;
        } else if (
          override.status === 'occupied' ||
          override.status === 'puppet' ||
          override.status === 'disputed'
        ) {
          const patId = `hatch-${controllerColor.replace('#', '')}`;
          colorSet.set(patId, controllerColor);
          fillMap[id] = `url(#${patId})`;
        } else {
          fillMap[id] = profile?.color ?? '#c2c9d1';
        }
      } else if (profile?.hatched) {
        const c = profile.color || '#c2a8cf';
        const patId = `hatch-${c.replace('#', '')}`;
        colorSet.set(patId, c);
        fillMap[id] = `url(#${patId})`;
      } else {
        fillMap[id] = profile?.color ?? '#c2c9d1';
      }
    }

    return { fills: fillMap, hatchPatterns: Array.from(colorSet.entries()) };
  }, [territoryOverrides, relationMap, mode, layer, playerCountryId]);

  const hoveredProfile = hoveredId ? COUNTRY_BY_ID[hoveredId] : null;
  const hoveredOverride = hoveredId ? territoryOverrides[hoveredId] : undefined;
  const hoveredRelation = hoveredId ? relationMap[hoveredId] : undefined;
  const inspectedProfile = inspectedId ? COUNTRY_BY_ID[inspectedId] : null;
  const inspectedOverride = inspectedId ? territoryOverrides[inspectedId] : undefined;
  const inspectedRelation = inspectedId ? relationMap[inspectedId] : undefined;

  const highlightFeatures = useMemo(() => {
    if (!highlightCountryIds.length) return [];
    const set = new Set(highlightCountryIds);
    return STATIC_MAP_DATA.features.filter((f) => set.has(f.id));
  }, [highlightCountryIds]);

  const activeSelectedId = mode === 'lobby' ? selectedCountryId : inspectedId ?? playerCountryId;

  return (
    <div
      className={`relative w-full ${heightClass} overflow-hidden rounded-xl border border-[#d6cfc2] bg-[#dce5ed] select-none`}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={`h-full w-full ${isDraggingUI ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          hoveredIdRef.current = null;
          setHoveredId(null);
          handlePointerUp();
        }}
        onClick={handleSvgClick}
        role="img"
        aria-label="Interactive diplomatic world atlas"
      >
        <defs>
          {hatchPatterns.map(([patId, color]) => (
            <pattern
              key={patId}
              id={patId}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" fill="#eef2f6" />
              <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="3.2" />
            </pattern>
          ))}
        </defs>

        {/* Cartographic pale-ice ocean plate */}
        <rect width={VIEW_W} height={VIEW_H} fill="#dce5ed" />

        <g
          ref={panGroupRef}
          transform={formatTransform(pan.x, pan.y, zoom)}
          style={{ transition: isDraggingUI ? 'none' : 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Fine engraved lat/lon graticule */}
          <g stroke="#c4d1de" strokeWidth={0.75 / zoom}>
            {STATIC_MAP_DATA.gridLines.verticals.map((x, idx) => (
              <line key={`v-${idx}`} x1={x} y1={-400} x2={x} y2={VIEW_H + 400} />
            ))}
            {STATIC_MAP_DATA.gridLines.horizontals.map((y, idx) => (
              <line key={`h-${idx}`} x1={-400} y1={y} x2={VIEW_W + 400} y2={y} />
            ))}
          </g>

          <CountryPolygons
            fills={fills}
            activeSelectedId={activeSelectedId}
            playerCountryId={playerCountryId}
            zoom={zoom}
          />

          {/* Subtle engraved brass markers for latest-turn headlines & border shifts */}
          {mode === 'gameplay' &&
            highlightFeatures.map((hf) => (
              <g key={`hl-${hf.id}`} pointerEvents="none">
                <circle
                  cx={hf.centroid[0]}
                  cy={hf.centroid[1]}
                  r={5 / zoom}
                  fill="#9b2c2c"
                  fillOpacity={0.18}
                  stroke="#9b2c2c"
                  strokeWidth={1.15 / zoom}
                />
                <circle
                  cx={hf.centroid[0]}
                  cy={hf.centroid[1]}
                  r={2 / zoom}
                  fill="#9b2c2c"
                />
              </g>
            ))}
        </g>
      </svg>

      {/* Top-right Zoom Controls */}
      <div className="absolute top-3.5 right-3.5 flex flex-col overflow-hidden rounded-lg border border-[#cfc8ba] bg-white/95 shadow-xs">
        <button
          type="button"
          onClick={() => zoomBy(1.35)}
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center text-[#2c3440] transition-colors hover:bg-[#f0ede6] hover:text-[#173a63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173a63]"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="h-px bg-[#e4dfd5]" />
        <button
          type="button"
          onClick={() => zoomBy(0.74)}
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center text-[#2c3440] transition-colors hover:bg-[#f0ede6] hover:text-[#173a63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173a63]"
        >
          <Minus className="h-4 w-4" />
        </button>
        {(zoom > 1.05 || Math.abs(pan.x) > 5 || Math.abs(pan.y) > 5) && (
          <>
            <div className="h-px bg-[#e4dfd5]" />
            <button
              type="button"
              onClick={resetView}
              aria-label="Reset map view"
              title="Reset view"
              className="flex h-8 w-8 items-center justify-center text-[#5c6672] transition-colors hover:bg-[#f0ede6] hover:text-[#173a63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173a63]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Bottom-left Map Layer Switcher in gameplay mode */}
      {mode === 'gameplay' && (
        <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1 rounded-lg border border-[#cfc8ba] bg-white/95 p-1 shadow-xs">
          {(['political', 'diplomatic', 'military'] as MapLayer[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setLayer(m)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                layer === m
                  ? 'bg-[#173a63] text-white'
                  : 'text-[#525d6b] hover:bg-[#f2efe8] hover:text-[#171a1f]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* Diplomatic / Military Legend */}
      {mode === 'gameplay' && layer === 'diplomatic' && (
        <div className="pointer-events-none absolute top-3.5 left-3.5 hidden sm:flex items-center gap-3 rounded-lg border border-[#cfc8ba] bg-white/95 px-3 py-1.5 text-[11px] text-[#45505e]">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-[#173a63]" />You</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-[#6fa887]" />Ally</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-[#7aa9bd]" />Partner</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-[#d4ae6a]" />Tense</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-[#c2696c]" />War / Sanctioned</span>
        </div>
      )}

      {mode === 'gameplay' && layer === 'military' && (
        <div className="pointer-events-none absolute top-3.5 left-3.5 hidden sm:flex items-center gap-3 rounded-lg border border-[#cfc8ba] bg-white/95 px-3 py-1.5 text-[11px] text-[#45505e]">
          <span className="font-medium text-[#171a1f]">Force index:</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-[#9e3b3f]" />Superpower</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-[#ba6752]" />Major</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-[#c99b59]" />Regional</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-[#7da1b5]" />Moderate</span>
        </div>
      )}

      {/* Zero-rerender floating Hover Tooltip positioned via direct DOM ref */}
      <div
        ref={tooltipRef}
        className={`pointer-events-none absolute top-0 left-0 z-20 max-w-[230px] rounded-lg border border-[#cfc8ba] bg-white/97 px-3 py-2 shadow-md transition-opacity duration-100 ${
          hoveredProfile && !isDraggingUI ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {hoveredProfile && (
          <>
            <div className="font-serif text-xs font-semibold text-[#171a1f]">
              {hoveredProfile.name}
            </div>
            <div className="mt-0.5 text-[11px] text-[#596472]">{hoveredProfile.leader}</div>
            {hoveredOverride && (
              <div className="mt-1 text-[11px] font-medium text-[#8b5a00]">
                {hoveredOverride.label}
              </div>
            )}
            {mode === 'gameplay' && hoveredRelation && (
              <div className="mt-1 text-[11px] text-[#3a4554]">
                {RELATION_LABELS[hoveredRelation.status] ?? hoveredRelation.status} · {hoveredRelation.note}
              </div>
            )}
            {mode === 'lobby' && (
              <div className="mt-1 font-mono text-[11px] text-[#5e6978] tabular-nums">
                GDP ${formatGdp(hoveredProfile.stats.gdp)}B · Pop {formatPopulation(hoveredProfile.stats.population)}M
              </div>
            )}
          </>
        )}
      </div>

      {/* Country Inspector Dossier in Gameplay mode */}
      {mode === 'gameplay' && inspectedProfile && inspectedProfile.id !== playerCountryId && (
        <div className="absolute right-3.5 bottom-3.5 z-20 w-[274px] rounded-lg border border-[#cfc8ba] bg-white/97 p-3.5 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-serif text-sm font-semibold text-[#171a1f]">
                {inspectedProfile.name}
              </div>
              <div className="text-xs text-[#5b6573]">{inspectedProfile.leader}</div>
            </div>
            <button
              type="button"
              onClick={() => setInspectedId(null)}
              aria-label="Close country dossier"
              className="rounded p-1 text-[#687280] hover:bg-[#f2efe8] hover:text-[#171a1f]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {inspectedOverride && (
            <div className="mt-2 border-t border-[#e8e3d9] pt-2 text-xs font-medium text-[#8b5a00]">
              {inspectedOverride.label}
            </div>
          )}

          {inspectedRelation && (
            <div className="mt-2 border-t border-[#e8e3d9] pt-2 text-xs text-[#3b4554]">
              <span className="font-semibold text-[#171a1f]">
                {RELATION_LABELS[inspectedRelation.status] ?? inspectedRelation.status}
              </span>
              <span className="mx-1.5 text-[#a0998d]">·</span>
              <span className="text-[#5c6573]">{inspectedRelation.note}</span>
            </div>
          )}

          <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-[#e8e3d9] pt-2.5 text-[11px]">
            <div>
              <span className="text-[#697280]">Population</span>
              <div className="font-mono font-medium text-[#171a1f] tabular-nums">
                {formatPopulation(inspectedProfile.stats.population)}M
              </div>
            </div>
            <div>
              <span className="text-[#697280]">GDP</span>
              <div className="font-mono font-medium text-[#171a1f] tabular-nums">
                ${formatGdp(inspectedProfile.stats.gdp)}B
              </div>
            </div>
            <div>
              <span className="text-[#697280]">Armed forces</span>
              <div className="font-mono font-medium text-[#171a1f] tabular-nums">
                {formatNumber(inspectedProfile.stats.armedForces)}
              </div>
            </div>
            <div>
              <span className="text-[#697280]">Tanks / Jets</span>
              <div className="font-mono font-medium text-[#171a1f] tabular-nums">
                {formatNumber(inspectedProfile.stats.tanks)} / {formatNumber(inspectedProfile.stats.fighterJets)}
              </div>
            </div>
          </div>

          {onMentionCountry && (
            <button
              type="button"
              onClick={() => {
                onMentionCountry(inspectedProfile.name);
                setInspectedId(null);
              }}
              className="mt-3 w-full rounded-md border border-[#cfc8ba] bg-[#f6f4ef] px-2.5 py-1.5 text-xs font-medium text-[#173a63] transition-colors hover:bg-[#ebe7dd]"
            >
              Draft action involving {inspectedProfile.name}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
