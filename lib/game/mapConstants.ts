/** マップは 20×20 マス（0〜19） */
export const MAP_GRID_SIZE = 20;

export const MAP_CELL_PX = 24;

export type MapBuildingKey = "grit" | "workbench";

export type MapBuildingDef = {
  key: MapBuildingKey;
  label: string;
  /** 横方向のマス数 */
  width: number;
  /** 縦方向のマス数 */
  height: number;
  /** 左上アンカー（グリッド座標） */
  defaultAnchor: { x: number; y: number };
};

/** 中央 4×4: G.R.I.T、右隣 横1×縦2: 工作台 */
export const MAP_BUILDING_DEFS: Record<MapBuildingKey, MapBuildingDef> = {
  grit: {
    key: "grit",
    label: "G.R.I.T",
    width: 4,
    height: 4,
    defaultAnchor: { x: 8, y: 8 },
  },
  workbench: {
    key: "workbench",
    label: "工作台",
    width: 1,
    height: 2,
    defaultAnchor: { x: 12, y: 8 },
  },
};

export function getDefaultPlacements(): Record<MapBuildingKey, { x: number; y: number }> {
  return {
    grit: { ...MAP_BUILDING_DEFS.grit.defaultAnchor },
    workbench: { ...MAP_BUILDING_DEFS.workbench.defaultAnchor },
  };
}

function cellsFor(
  anchor: { x: number; y: number },
  def: MapBuildingDef
): Set<string> {
  const s = new Set<string>();
  for (let dy = 0; dy < def.height; dy++) {
    for (let dx = 0; dx < def.width; dx++) {
      s.add(`${anchor.x + dx},${anchor.y + dy}`);
    }
  }
  return s;
}

export function canPlaceBuilding(
  movingKey: MapBuildingKey,
  anchor: { x: number; y: number },
  placements: Record<MapBuildingKey, { x: number; y: number }>
): boolean {
  const def = MAP_BUILDING_DEFS[movingKey];
  if (
    anchor.x < 0 ||
    anchor.y < 0 ||
    anchor.x + def.width > MAP_GRID_SIZE ||
    anchor.y + def.height > MAP_GRID_SIZE
  ) {
    return false;
  }
  const mine = cellsFor(anchor, def);
  const others = (Object.keys(placements) as MapBuildingKey[]).filter((k) => k !== movingKey);
  for (const k of others) {
    const odef = MAP_BUILDING_DEFS[k];
    const ocells = cellsFor(placements[k], odef);
    for (const c of mine) {
      if (ocells.has(c)) return false;
    }
  }
  return true;
}
