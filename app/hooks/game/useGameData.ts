import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { DEV_USER_ID } from '@/lib/devUser';

export function useGameData() {
  const [resources, setResources] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [craftQueue, setCraftQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    const userId = DEV_USER_ID;

    try {
      // 4つのテーブルからデータを一括取得
      const [unitsRes, invRes, resRes, profileRes, queueRes] = await Promise.all([
        supabase.from('game_unit').select('*').eq('user_id', userId),
        supabase.from('game_inventory').select('*').eq('user_id', userId),
        supabase.from('game_resources').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('game_craft_queue').select('*').eq('user_id', userId)
      ]);

      // それぞれStateに格納
      setUnits(unitsRes.data || []);
      setInventory(invRes.data || []);
      setCraftQueue(queueRes.data || []);
      setResources({
      ...(resRes.data || {}),
      grit: profileRes.data?.grit || 0 // profile側のgritを優先的に入れる
      });

    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 全部のデータと、再取得用のrefresh関数を返す
  return { 
    resources, 
    units, 
    inventory, 
    craftQueue, 
    isLoading, 
    refresh: fetchData 
  };
}