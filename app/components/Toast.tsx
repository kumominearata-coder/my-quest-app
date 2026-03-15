import { motion, AnimatePresence } from "framer-motion";

export default function Toast({ message, isVisible, onClose }: { message: string, isVisible: boolean, onClose: () => void }) {
  return (
    <AnimatePresence>
      {isVisible && (
        // 画面のちょうど真ん中に配置。backdrop-blurを強めにして背景から浮き立たせるよ
        <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur-2xl border border-amber-500/40 text-amber-50 px-8 py-5 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center text-center max-w-[80%]"
            onClick={onClose}
          >
            <div className="text-3xl mb-3">✉️</div>
            <div className="text-base font-medium leading-relaxed tracking-wide">
              {message}
            </div>
            <div className="mt-4 text-[10px] text-amber-500/60 uppercase tracking-[0.2em]">
              Tap to close
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}