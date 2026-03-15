"use client";

import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableTaskItem } from "./SortableTaskItem";
import { supabase } from "@/lib/supabase";

type TaskListProps = {
  tasks: any[];
  setTasks: (tasks: any[]) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  completeTask: (task: any) => void;
  onEdit: (task: any) => void;
  updateHabitGrit: (task: any, direction: "plus" | "minus") => void;
};

export default function TaskList({
  tasks,
  setTasks,
  activeTab,
  setActiveTab,
  completeTask,
  onEdit,
  updateHabitGrit,
}: TaskListProps) {
  
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { 
      activationConstraint: { delay: 100, tolerance: 8 } 
    })
  );

  const getDiffLabel = (diff: number) => {
    switch (diff) {
      case 1: return { text: "Easy", color: "text-blue-300 border-blue-500/50" };
      case 3: return { text: "Hard", color: "text-orange-300 border-orange-500/50" };
      case 4: return { text: "Lunatic", color: "text-red-300 border-red-500/50" };
      default: return { text: "Normal", color: "text-green-300 border-green-500/50" };
    }
  };

  const filteredTasks = tasks
    .filter((t) => t.type === activeTab)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = filteredTasks.findIndex((t) => t.id === active.id);
      const newIndex = filteredTasks.findIndex((t) => t.id === over.id);
      
      const movedTasks = arrayMove(filteredTasks, oldIndex, newIndex);
      
      const updatedFiltered = movedTasks.map((task, index) => ({
        ...task,
        sort_order: index
      }));

      const otherTasks = tasks.filter((t) => t.type !== activeTab);
      const newAllTasks = [...otherTasks, ...updatedFiltered];
      
      setTasks(newAllTasks);

      try {
        const promises = updatedFiltered.map((task) => {
          return supabase
            .from("tasks")
            .update({ sort_order: task.sort_order })
            .eq("id", task.id);
        });
        await Promise.all(promises);
      } catch (error: any) {
        console.error("並び替えの保存に失敗しちゃった:", error.message);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={filteredTasks.map((t) => t.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <SortableTaskItem 
                  key={task.id} 
                  id={task.id} 
                  task={task} 
                  getDiffLabel={getDiffLabel}
                  completeTask={completeTask}
                  onEdit={onEdit}
                  updateHabitGrit={updateHabitGrit}
                />
              ))
            ) : (
              <div className="text-center py-20 text-slate-600 animate-pulse">
                <p className="text-sm">表示するクエストがないよ。</p>
                <p className="text-[10px] mt-1 uppercase tracking-widest">No active tasks in this category</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}