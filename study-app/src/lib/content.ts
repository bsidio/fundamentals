import { studyPlan } from "./study-data";
import fs from "fs";
import path from "path";

export function getTopicById(id: string) {
  for (const day of studyPlan) {
    const topic = day.topics.find((t) => t.id === id);
    if (topic) {
      return { topic, day };
    }
  }
  return null;
}

export function getTopicContent(filePath: string): string {
  // Path relative to study-plan directory (parent of study-app)
  const fullPath = path.join(process.cwd(), "..", filePath);

  try {
    return fs.readFileSync(fullPath, "utf-8");
  } catch (error) {
    console.error(`Failed to read file: ${fullPath}`, error);
    return `# Content Not Found\n\nCould not load content from \`${filePath}\``;
  }
}

export function getAllTopicIds(): string[] {
  return studyPlan.flatMap((day) => day.topics.map((t) => t.id));
}

export function getAdjacentTopics(currentId: string) {
  const allTopics = studyPlan.flatMap((day) =>
    day.topics.map((topic) => ({ ...topic, dayId: day.id, dayTitle: day.title }))
  );

  const currentIndex = allTopics.findIndex((t) => t.id === currentId);

  return {
    prev: currentIndex > 0 ? allTopics[currentIndex - 1] : null,
    next: currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null,
  };
}
