"use client";

import { motion } from "framer-motion";
import { Server, Layout, Cloud, Cpu } from "lucide-react";
import { techStack, coreEndpoints, readinessChecklist } from "@/lib/study-data";

const categories = [
  { key: "backend", label: "Backend", icon: Server },
  { key: "frontend", label: "Frontend", icon: Layout },
  { key: "infrastructure", label: "Infrastructure", icon: Cloud },
  { key: "integration", label: "Integration", icon: Cpu },
] as const;

export function TechStackPanel() {
  return (
    <motion.section
      id="tech-stack"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="mt-16"
    >
      <h2 className="text-xl font-semibold mb-6 text-text">
        Tech Stack
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="terminal-card p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <cat.icon className="w-4 h-4 text-text-secondary" />
              <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                {cat.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {techStack[cat.key].map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 text-xs rounded-md bg-bg border border-border text-text-secondary"
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="terminal-card p-5"
        >
          <h3 className="text-sm font-semibold mb-4 text-text">
            Key Endpoints
          </h3>
          <div className="space-y-2 text-sm">
            {coreEndpoints.map((endpoint) => (
              <div
                key={`${endpoint.method}-${endpoint.path}`}
                className="flex items-center gap-3 p-2 rounded-md bg-bg"
              >
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    endpoint.method === "GET"
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "bg-green-50 text-green-600 border border-green-200"
                  }`}
                >
                  {endpoint.method}
                </span>
                <span className="text-text font-mono text-xs">{endpoint.path}</span>
                <span className="text-text-muted text-xs ml-auto">
                  {endpoint.description}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="terminal-card p-5"
        >
          <h3 className="text-sm font-semibold mb-4 text-text">
            Ready When You Can...
          </h3>
          <ul className="space-y-2">
            {readinessChecklist.map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 rounded-md bg-bg border border-border flex items-center justify-center text-[10px] text-text-muted flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-text-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.section>
  );
}
