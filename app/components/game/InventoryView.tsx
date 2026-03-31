"use client";

import { useGameData } from "../../hooks/game/useGameData";
import { Box, Package, Database } from "lucide-react";
import { getItemDisplayName } from "@/app/types/Items";

export default function InventoryView() {
  const { inventory, isLoading } = useGameData();

  if (isLoading) return <div className="p-10 text-slate-500 font-mono">LOADING DATA...</div>;

  return (
    <div className="flex-1 p-4 overflow-y-auto pb-32 bg-slate-950/50">
      <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-emerald-500 tracking-tighter">
        <Database size={20} /> STORAGE UNIT
      </h2>

      {inventory.length === 0 ? (
        <div className="text-center p-10 border border-dashed border-white/10 rounded-2xl text-slate-600">
          <Package size={40} className="mx-auto mb-2 opacity-20" />
          <p className="text-xs font-mono">NO ITEMS DETECTED</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {inventory.map((item: any) => (
            <div key={item.item_id} className="bg-slate-900 border border-white/5 p-3 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
                {getItemDisplayName(item.item_id)}
              </span>
              <div className="flex justify-between items-end mt-1">
                <span className="font-bold text-slate-200">
                  {getItemDisplayName(item.item_id)}
                </span>
                <span className="text-emerald-400 font-mono font-black text-xl leading-none">
                  {item.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}