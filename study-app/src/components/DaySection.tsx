"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Day } from "@/lib/study-data";
import { TopicCard } from "./TopicCard";

interface DaySectionProps {
  day: Day;
  completedTopics: Set<string>;
  onToggleTopic: (topicId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function DaySection({
  day,
  completedTopics,
  onToggleTopic,
  isExpanded,
  onToggleExpand,
}: DaySectionProps) {
  const completedCount = day.topics.filter((t) => completedTopics.has(t.id)).length;
  const progress = (completedCount / day.topics.length) * 100;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      <button
        onClick={onToggleExpand}
        className="w-full text-left group"
      >
        <div className="terminal-card p-5 transition-all duration-200 hover:border-border-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-bg border border-border flex items-center justify-center text-lg">
                {day.icon}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-text">
                    Day {day.id}: {day.title}
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-bg border border-border text-text-muted uppercase tracking-wide">
                    {day.subtitle}
                  </span>
                </div>
                <p className="text-sm text-text-muted mt-0.5">
                  {day.topics.length} topics · {day.totalTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-lg font-semibold text-text">
                  {completedCount}/{day.topics.length}
                </div>
                <div className="text-xs text-text-muted">
                  completed
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-text-secondary" />
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 progress-bar">
            <motion.div
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                background: progress === 100 ? "var(--color-success)" : "var(--color-accent)",
              }}
            />
          </div>
        </div>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="pt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {day.topics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              index={index}
              dayColor={day.color}
              isCompleted={completedTopics.has(topic.id)}
              onToggle={() => onToggleTopic(topic.id)}
            />
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
