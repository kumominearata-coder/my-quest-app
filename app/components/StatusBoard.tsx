// app/components/StatusBoard.tsx
type StatusProps = {
  grit: number; // level を削除
};

export default function StatusBoard({ grit }: StatusProps) {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl border-t-4 border-amber-600 w-full max-w-md mb-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl font-black italic select-none">GRIT</div>
      
      <h1 className="text-xl font-bold text-amber-500 mb-4 text-center tracking-widest">ADVENTURER STATUS</h1>
      
      <div className="flex justify-center items-center py-4">
        <div className="flex flex-col items-center">
          <span className="text-slate-500 text-[10px] uppercase tracking-tighter mb-1">Total Accumulated Grit</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-5xl text-amber-400 font-bold">{grit.toLocaleString()}</span>
            <span className="text-amber-600 font-bold text-xl">G</span>
          </div>
        </div>
      </div>
      
      {/* ここに今後、STRとかINTを表示するエリアを作ると格好いいね！ */}
    </div>
  );
}