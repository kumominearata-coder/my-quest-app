"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  MAP_BUILDING_DEFS,
  MAP_CELL_PX,
  MAP_GRID_SIZE,
  type MapBuildingKey,
  canPlaceBuilding,
} from "@/lib/game/mapConstants";
import { useMapBuildings } from "@/app/hooks/game/useMapBuildings";

type GameMapViewProps = {
  buildMode: boolean;
  onTapGrit: () => void;
  onTapWorkbench: () => void;
};

function touchDistance(
  a: { clientX: number; clientY: number },
  b: { clientX: number; clientY: number }
) {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

export default function GameMapView({
  buildMode,
  onTapGrit,
  onTapWorkbench,
}: GameMapViewProps) {
  const { placements, updatePlacement, ready } = useMapBuildings();
  const viewportRef = useRef<HTMLDivElement>(null);
  const mapLayerRef = useRef<HTMLDivElement>(null);
  const centeredRef = useRef(false);

  /** パン位置はドラッグ中は ref のみ更新し、React の再描画を避ける */
  const panRef = useRef({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);

  const applyMapTransform = useCallback(() => {
    const layer = mapLayerRef.current;
    if (!layer) return;
    const p = panRef.current;
    const z = zoomRef.current;
    layer.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${z})`;
  }, []);

  const panningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);

  const [dragging, setDragging] = useState<MapBuildingKey | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number; key: MapBuildingKey } | null>(null);
  const movedRef = useRef(false);
  const longPressActivatedRef = useRef(false);

  const mapPx = MAP_GRID_SIZE * MAP_CELL_PX;

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el || !ready || centeredRef.current) return;
    const r = el.getBoundingClientRect();
    const z = zoomRef.current;
    const cx = (r.width - mapPx * z) / 2;
    const cy = (r.height - mapPx * z) / 2;
    panRef.current = { x: cx, y: cy };
    applyMapTransform();
    centeredRef.current = true;
  }, [ready, mapPx, applyMapTransform]);

  useEffect(() => {
    zoomRef.current = zoom;
    applyMapTransform();
  }, [zoom, applyMapTransform]);

  const screenToGridAnchor = useCallback(
    (clientX: number, clientY: number, key: MapBuildingKey) => {
      const layer = mapLayerRef.current;
      if (!layer) return null;
      const rect = layer.getBoundingClientRect();
      const z = zoomRef.current;
      const lx = (clientX - rect.left) / z;
      const ly = (clientY - rect.top) / z;
      const def = MAP_BUILDING_DEFS[key];
      let gx = Math.floor(lx / MAP_CELL_PX);
      let gy = Math.floor(ly / MAP_CELL_PX);
      gx = Math.max(0, Math.min(gx, MAP_GRID_SIZE - def.width));
      gy = Math.max(0, Math.min(gy, MAP_GRID_SIZE - def.height));
      return { x: gx, y: gy };
    },
    []
  );

  const clearLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const anchor = screenToGridAnchor(e.clientX, e.clientY, dragging);
      if (anchor && canPlaceBuilding(dragging, anchor, placements)) {
        updatePlacement(dragging, anchor);
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
    };
  }, [dragging, placements, screenToGridAnchor, updatePlacement]);

  const onPointerDownMap = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-building]")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    panningRef.current = true;
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMoveMap = (e: React.PointerEvent) => {
    if (!panningRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    panRef.current = {
      x: panStartRef.current.panX + dx,
      y: panStartRef.current.panY + dy,
    };
    applyMapTransform();
  };

  const onPointerUpMap = (e: React.PointerEvent) => {
    panningRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onWheelMap = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((z) => Math.min(3, Math.max(0.4, z + delta)));
  };

  const onTouchStartMap = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const pinch = {
        startDist: touchDistance(e.touches[0], e.touches[1]),
        startZoom: zoomRef.current,
      };
      pinchRef.current = pinch;
    }
  };

  const onTouchMoveMap = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    const pinch = pinchRef.current;
    if (!pinch) return;
    e.preventDefault();
    const d = touchDistance(e.touches[0], e.touches[1]);
    const ratio = pinch.startDist > 0 ? d / pinch.startDist : 1;
    const nextZoom = Math.min(3, Math.max(0.4, pinch.startZoom * ratio));
    setZoom(nextZoom);
  };

  const onTouchEndMap = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchRef.current = null;
    }
  };

  const onBuildingPointerDown = (key: MapBuildingKey, e: React.PointerEvent) => {
    e.stopPropagation();
    movedRef.current = false;
    longPressActivatedRef.current = false;
    pointerDownRef.current = { x: e.clientX, y: e.clientY, key };
    clearLongPress();

    if (!buildMode) return;

    longPressRef.current = setTimeout(() => {
      longPressActivatedRef.current = true;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setDragging(key);
      longPressRef.current = null;
    }, 450);
  };

  const onBuildingPointerMove = (e: React.PointerEvent) => {
    if (!pointerDownRef.current) return;
    const dx = e.clientX - pointerDownRef.current.x;
    const dy = e.clientY - pointerDownRef.current.y;
    if (Math.hypot(dx, dy) > 14) {
      movedRef.current = true;
      clearLongPress();
    }
  };

  const fireTap = (key: MapBuildingKey) => {
    if (key === "grit") onTapGrit();
    else onTapWorkbench();
  };

  const onBuildingPointerUp = (key: MapBuildingKey, e: React.PointerEvent) => {
    e.stopPropagation();
    clearLongPress();

    if (dragging) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setDragging(null);
      longPressActivatedRef.current = false;
      pointerDownRef.current = null;
      return;
    }

    if (!buildMode) {
      if (!movedRef.current) fireTap(key);
      pointerDownRef.current = null;
      return;
    }

    if (!longPressActivatedRef.current && !movedRef.current) {
      fireTap(key);
    }
    pointerDownRef.current = null;
    longPressActivatedRef.current = false;
  };

  useEffect(() => {
    return () => clearLongPress();
  }, []);

  return (
    <div
      ref={viewportRef}
      className="relative h-full min-h-0 w-full flex-1 touch-none overflow-hidden bg-slate-950"
      onPointerDown={onPointerDownMap}
      onPointerMove={onPointerMoveMap}
      onPointerUp={onPointerUpMap}
      onPointerCancel={onPointerUpMap}
      onWheel={onWheelMap}
      onTouchStart={onTouchStartMap}
      onTouchMove={onTouchMoveMap}
      onTouchEnd={onTouchEndMap}
      onTouchCancel={onTouchEndMap}
    >
      <div
        ref={mapLayerRef}
        className="absolute left-0 top-0 will-change-transform"
        style={{
          transformOrigin: "0 0",
          width: mapPx,
          height: mapPx,
        }}
      >
        <div
          className="grid gap-0 border border-white/15 bg-slate-900/30"
          style={{
            gridTemplateColumns: `repeat(${MAP_GRID_SIZE}, ${MAP_CELL_PX}px)`,
            gridTemplateRows: `repeat(${MAP_GRID_SIZE}, ${MAP_CELL_PX}px)`,
            width: mapPx,
            height: mapPx,
          }}
        >
          {Array.from({ length: MAP_GRID_SIZE * MAP_GRID_SIZE }).map((_, i) => (
            <div key={i} className="border border-white/[0.06] bg-slate-950/20" />
          ))}
        </div>

        {(Object.keys(MAP_BUILDING_DEFS) as MapBuildingKey[]).map((key) => {
          const def = MAP_BUILDING_DEFS[key];
          const pos = placements[key];
          const w = def.width * MAP_CELL_PX;
          const h = def.height * MAP_CELL_PX;
          const left = pos.x * MAP_CELL_PX;
          const top = pos.y * MAP_CELL_PX;
          const isGrit = key === "grit";
          return (
            <div
              key={key}
              data-building
              className={`absolute flex items-center justify-center rounded-lg border-2 text-center font-black text-[10px] leading-tight p-1 select-none ${
                isGrit
                  ? "border-amber-500/60 bg-amber-500/20 text-amber-200"
                  : "border-blue-500/60 bg-blue-500/20 text-blue-200"
              } ${buildMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
              style={{
                left,
                top,
                width: w,
                height: h,
                zIndex: dragging === key ? 20 : 10,
                opacity: dragging === key ? 0.88 : 1,
              }}
              onPointerDown={(e) => onBuildingPointerDown(key, e)}
              onPointerMove={onBuildingPointerMove}
              onPointerUp={(e) => onBuildingPointerUp(key, e)}
              onPointerCancel={(e) => onBuildingPointerUp(key, e)}
            >
              {def.label}
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute bottom-2 left-2 z-30 rounded-lg bg-black/50 px-2 py-1 font-mono text-[10px] text-slate-400">
        ドラッグで移動 / ピンチで拡縮
      </div>
    </div>
  );
}
