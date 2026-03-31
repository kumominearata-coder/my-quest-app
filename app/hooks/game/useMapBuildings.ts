import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEV_USER_ID } from "@/lib/devUser";
import {
  type MapBuildingKey,
  getDefaultPlacements,
} from "@/lib/game/mapConstants";

const LS_KEY = "game_map_buildings_v1";

type Row = {
  building_key: string;
  anchor_x: number;
  anchor_y: number;
};

export function useMapBuildings() {
  const userId = DEV_USER_ID;
  const [placements, setPlacements] = useState(getDefaultPlacements);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("game_map_buildings")
        .select("building_key, anchor_x, anchor_y")
        .eq("user_id", userId);

      if (!cancelled && !error && data && data.length > 0) {
        const next = getDefaultPlacements();
        for (const row of data as Row[]) {
          const k = row.building_key as MapBuildingKey;
          if (k === "grit" || k === "workbench") {
            next[k] = { x: row.anchor_x, y: row.anchor_y };
          }
        }
        setPlacements(next);
      } else if (error) {
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as Record<MapBuildingKey, { x: number; y: number }>;
            if (parsed?.grit && parsed?.workbench) {
              setPlacements(parsed);
            }
          }
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    async (next: Record<MapBuildingKey, { x: number; y: number }>) => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      const rows = (Object.keys(next) as MapBuildingKey[]).map((k) => ({
        user_id: userId,
        building_key: k,
        anchor_x: next[k].x,
        anchor_y: next[k].y,
      }));
      const { error } = await supabase.from("game_map_buildings").upsert(rows, {
        onConflict: "user_id,building_key",
      });
      if (error) {
        console.warn("game_map_buildings upsert:", error.message);
      }
    },
    [userId]
  );

  const updatePlacement = useCallback(
    (key: MapBuildingKey, anchor: { x: number; y: number }) => {
      setPlacements((prev) => {
        const next = { ...prev, [key]: anchor };
        void persist(next);
        return next;
      });
    },
    [persist]
  );

  return { placements, updatePlacement, ready };
}
