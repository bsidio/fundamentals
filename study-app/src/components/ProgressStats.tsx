"use client";

import { motion } from "framer-motion";
import { Target, Clock, Calendar, CheckCircle } from "lucide-react";
import { studyPlan } from "@/lib/study-data";

interface ProgressStatsProps {
  completedTopics: Set<string>;
}

export function ProgressStats({ completedTopics }: ProgressStatsProps) {
  const totalTopics = studyPlan.reduce((sum, day) => sum + day.topics.length, 0);
  const completedCount = completedTopics.size;
  const progressPercent = Math.round((completedCount / totalTopics) * 100);

  const remainingTopics = studyPlan.flatMap((day) =>
    day.topics.filter((t) => !completedTopics.has(t.id))
  );

  const parseTime = (timeStr: string): number => {
    const match = timeStr.match(/(\d+\.?\d*)-?(\d+\.?\d*)?\s*(min|h)/);
    if (!match) return 60;
    const min = parseFloat(match[1]);
    const max = match[2] ? parseFloat(match[2]) : min;
    const avg = (min + max) / 2;
    return match[3] === "h" ? avg * 60 : avg;
  };

  const remainingMinutes = remainingTopics.reduce(
    (sum, t) => sum + parseTime(t.duration),
    0
  );
  const remainingHours = Math.round(remainingMinutes / 60 * 10) / 10;

  const dayProgress = studyPlan.map((day) => ({
    day: day.id,
    completed: day.topics.filter((t) => completedTopics.has(t.id)).length,
    total: day.topics.length,
  }));

  const daysStarted = dayProgress.filter((d) => d.completed > 0).length;

  const stats = [
    {
      icon: Target,
      label: "Progress",
      value: `${progressPercent}%`,
      subtext: `${completedCount} of ${totalTopics} topics`,
    },
    {
      icon: Clock,
      label: "Remaining",
      value: `${remainingHours}h`,
      subtext: "estimated",
    },
    {
      icon: Calendar,
      label: "Days",
      value: `${daysStarted}/4`,
      subtext: "started",
    },
    {
      icon: CheckCircle,
      label: "Status",
      value: progressPercent === 100 ? "Ready" : progressPercent >= 75 ? "Almost" : "In Progress",
      subtext: progressPercent === 100 ? "interview ready" : "keep going",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="terminal-card p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center">
              <stat.icon className="w-4 h-4 text-text-secondary" />
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wide mb-0.5">
                {stat.label}
              </div>
              <div className="text-xl font-semibold text-text">
                {stat.value}
              </div>
              <div className="text-xs text-text-muted">{stat.subtext}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
