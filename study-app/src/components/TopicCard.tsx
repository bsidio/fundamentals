"use client";

import { motion } from "framer-motion";
import { Clock, Check, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Topic } from "@/lib/study-data";

interface TopicCardProps {
  topic: Topic;
  index: number;
  dayColor: string;
  isCompleted: boolean;
  onToggle: () => void;
}

export function TopicCard({ topic, index, isCompleted, onToggle }: TopicCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group"
    >
      <div
        className={`terminal-card p-4 transition-all duration-200 hover:border-border-hover ${
          isCompleted ? "bg-bg" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle();
            }}
            className="mt-0.5 flex-shrink-0 transition-colors z-10"
            aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
          >
            {isCompleted ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <Circle className="w-5 h-5 text-border-hover hover:text-text-secondary transition-colors" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <Link href={`/topic/${topic.id}`} className="block group/link">
              <h3
                className={`font-medium text-sm mb-1 transition-colors group-hover/link:underline ${
                  isCompleted ? "line-through text-text-muted" : "text-text"
                }`}
              >
                {topic.title}
                <ArrowRight className="w-3 h-3 inline-block ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </h3>
            </Link>

            <p className={`text-sm mb-2 ${isCompleted ? "text-text-muted" : "text-text-secondary"}`}>
              {topic.description}
            </p>

            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {topic.duration}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {topic.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[10px] rounded-full bg-bg text-text-muted border border-border"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
