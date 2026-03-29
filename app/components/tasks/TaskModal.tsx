"use client";

import { motion, AnimatePresence } from "framer-motion";
import TaskForm from "./TaskForm";

// page.tsx から受け取るデータの型定義
type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  editingTask: any;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onAdd: () => void;
  onUpdate: () => void;
  onDelete: (id: string) => void;
};

export default function TaskModal({
  isOpen,
  onClose,
  editingTask,
  formData,
  setFormData,
  onAdd,
  onUpdate,
  onDelete,
}: TaskModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* 背景のボカシと黒透過 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* モーダル本体 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md relative z-[210]"
          >
            <TaskForm
              newTaskTitle={formData.title}
              setNewTaskTitle={(val) => setFormData((prev: any) => ({ ...prev, title: val }))}
              note={formData.note}
              setNote={(val) => setFormData((prev: any) => ({ ...prev, note: val }))}
              tagsInput={formData.tagsInput}
              setTagsInput={(val) => setFormData((prev: any) => ({ ...prev, tagsInput: val }))}
              selectedType={formData.type}
              setSelectedType={(val) => setFormData((prev: any) => ({ ...prev, type: val }))}
              rewardGrit={formData.rewardGrit}
              setRewardGrit={(val) => setFormData((prev: any) => ({ ...prev, rewardGrit: val }))}
              penaltyGrit={formData.penaltyGrit}
              setPenaltyGrit={(val) => setFormData((prev: any) => ({ ...prev, penaltyGrit: val }))}
              calcParams={formData.calcParams}
              setCalcParams={(val) => setFormData((prev: any) => ({ ...prev, calcParams: val }))}
              habitType={formData.habitType}
              setHabitType={(val) => setFormData((prev: any) => ({ ...prev, habitType: val }))}
              dueDate={formData.dueDate}
              setDueDate={(val) => setFormData((prev: any) => ({ ...prev, dueDate: val }))}
              targetDays={formData.targetDays}
              setTargetDays={(val) => setFormData((prev: any) => ({ ...prev, targetDays: val }))}
              addTask={onAdd}
              updateTask={onUpdate}
              deleteTask={() => editingTask && onDelete(editingTask.id)}
              cancelEdit={onClose}
              editingTask={editingTask}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}