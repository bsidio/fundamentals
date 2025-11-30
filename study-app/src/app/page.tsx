"use client";

import { useState, useEffect } from "react";
import { studyPlan } from "@/lib/study-data";
import { Header } from "@/components/Header";
import { ProgressStats } from "@/components/ProgressStats";
import { DaySection } from "@/components/DaySection";
import { TechStackPanel } from "@/components/TechStackPanel";

const STORAGE_KEY = "study-plan-progress";

export default function Home() {
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedTopics(new Set(parsed));
      } catch (e) {
        console.error("Failed to load progress:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(completedTopics))
      );
    }
  }, [completedTopics, mounted]);

  const toggleTopic = (topicId: string) => {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const toggleDay = (dayId: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg">
        <main className="max-w-5xl mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-10 w-64 bg-border rounded mb-2" />
            <div className="h-5 w-40 bg-border rounded" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-5xl mx-auto px-6 py-12">
        <Header />

        <ProgressStats completedTopics={completedTopics} />

        <div className="space-y-4">
          {studyPlan.map((day) => (
            <DaySection
              key={day.id}
              day={day}
              completedTopics={completedTopics}
              onToggleTopic={toggleTopic}
              isExpanded={expandedDays.has(day.id)}
              onToggleExpand={() => toggleDay(day.id)}
            />
          ))}
        </div>

        <TechStackPanel />

        <footer className="mt-16 pt-6 border-t border-border text-center">
          <p className="text-sm text-text-muted">
            Good luck with your interview!
          </p>
          <p className="text-xs text-text-muted mt-1">
            Progress saved locally
          </p>
        </footer>
      </main>
    </div>
  );
}
