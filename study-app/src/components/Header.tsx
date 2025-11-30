"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div>
          <p className="text-sm text-text-muted mb-1">Interview Prep</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-text">
            ML Experiment Tracker
          </h1>
          <p className="text-text-secondary mt-1">
            4 days · ~25 hours total
          </p>
        </div>

        <motion.a
          href="#tech-stack"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="terminal-card px-4 py-2 flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>Tech Stack</span>
        </motion.a>
      </motion.div>

      <div className="mt-8 h-px bg-border" />
    </header>
  );
}
