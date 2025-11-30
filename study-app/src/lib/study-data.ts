export interface Topic {
  id: string;
  title: string;
  file: string;
  duration: string;
  description: string;
  tags: string[];
}

export interface Day {
  id: number;
  title: string;
  subtitle: string;
  totalTime: string;
  color: string;
  icon: string;
  topics: Topic[];
}

export const studyPlan: Day[] = [
  {
    id: 1,
    title: "Python + Backend + DB",
    subtitle: "Full Day",
    totalTime: "~7h",
    color: "day1",
    icon: "🐍",
    topics: [
      {
        id: "1-1",
        title: "Python Warmup",
        file: "day1-python-backend-db/01-python-warmup.md",
        duration: "60-90 min",
        description: "Comprehensions, context managers, exceptions",
        tags: ["python", "fundamentals"],
      },
      {
        id: "1-2",
        title: "Backend API Basics",
        file: "day1-python-backend-db/02-backend-api.md",
        duration: "2-2.5h",
        description: "Flask/FastAPI, validation, logging",
        tags: ["api", "fastapi", "flask"],
      },
      {
        id: "1-3",
        title: "Database Schema Design",
        file: "day1-python-backend-db/03-database-schema.md",
        duration: "1.5-2h",
        description: "Tables, indexes, SQL queries",
        tags: ["sql", "postgres", "schema"],
      },
      {
        id: "1-4",
        title: "DB Integration with API",
        file: "day1-python-backend-db/04-db-integration.md",
        duration: "1-1.5h",
        description: "ORM, session management",
        tags: ["sqlalchemy", "orm"],
      },
      {
        id: "1-5",
        title: "System Design Sketch",
        file: "day1-python-backend-db/05-system-design.md",
        duration: "1-2h",
        description: "Architecture, scaling, caching",
        tags: ["architecture", "scaling"],
      },
    ],
  },
  {
    id: 2,
    title: "React + Security",
    subtitle: "Full Day",
    totalTime: "~7h",
    color: "day2",
    icon: "⚛️",
    topics: [
      {
        id: "2-1",
        title: "React Fundamentals",
        file: "day2-react-security/01-react-fundamentals.md",
        duration: "1-1.5h",
        description: "Components, props, state, hooks",
        tags: ["react", "hooks"],
      },
      {
        id: "2-2",
        title: "Data Fetching",
        file: "day2-react-security/02-data-fetching.md",
        duration: "1.5-2h",
        description: "API calls, loading/error states, filters",
        tags: ["api", "async"],
      },
      {
        id: "2-3",
        title: "Dashboard UI",
        file: "day2-react-security/03-dashboard-ui.md",
        duration: "2h",
        description: "Experiment details, status badges, metrics",
        tags: ["ui", "components"],
      },
      {
        id: "2-4",
        title: "Security Fundamentals",
        file: "day2-react-security/04-security-fundamentals.md",
        duration: "1h",
        description: "Auth, CORS, vulnerabilities",
        tags: ["security", "auth"],
      },
      {
        id: "2-5",
        title: "Project Story",
        file: "day2-react-security/05-project-story.md",
        duration: "1-2h",
        description: "STAR format, talking points",
        tags: ["interview", "soft-skills"],
      },
    ],
  },
  {
    id: 3,
    title: "K8s + Linux + ML",
    subtitle: "Full Day",
    totalTime: "~7h",
    color: "day3",
    icon: "☸️",
    topics: [
      {
        id: "3-1",
        title: "Kubernetes Concepts",
        file: "day3-k8s-linux-ml/01-kubernetes-concepts.md",
        duration: "2h",
        description: "Deployments, services, manifests",
        tags: ["k8s", "containers"],
      },
      {
        id: "3-2",
        title: "CI/CD Pipeline",
        file: "day3-k8s-linux-ml/02-cicd-pipeline.md",
        duration: "1.5-2h",
        description: "Stages, branching, image tagging",
        tags: ["cicd", "devops"],
      },
      {
        id: "3-3",
        title: "Linux Fundamentals",
        file: "day3-k8s-linux-ml/03-linux-fundamentals.md",
        duration: "1-1.5h",
        description: "Debugging, processes, logs",
        tags: ["linux", "debugging"],
      },
      {
        id: "3-4",
        title: "Infrastructure Components",
        file: "day3-k8s-linux-ml/04-infrastructure-components.md",
        duration: "1h",
        description: "Redis, message queues",
        tags: ["redis", "rabbitmq"],
      },
      {
        id: "3-5",
        title: "HPC Basics",
        file: "day3-k8s-linux-ml/05-hpc-basics.md",
        duration: "30-45 min",
        description: "SLURM, GPU resources, integration",
        tags: ["hpc", "slurm"],
      },
      {
        id: "3-6",
        title: "ML Fundamentals",
        file: "day3-k8s-linux-ml/06-ml-fundamentals.md",
        duration: "1-2h",
        description: "Training loop, metrics, tracking",
        tags: ["ml", "training"],
      },
    ],
  },
  {
    id: 4,
    title: "Review & Mock",
    subtitle: "Half Day",
    totalTime: "~4h",
    color: "day4",
    icon: "🎯",
    topics: [
      {
        id: "4-1",
        title: "Cheat Sheet Creation",
        file: "day4-review/01-cheat-sheet.md",
        duration: "1-1.5h",
        description: "One-page reference",
        tags: ["review", "summary"],
      },
      {
        id: "4-2",
        title: "Topic Flash Review",
        file: "day4-review/02-topic-flash-review.md",
        duration: "30-45 min",
        description: "Quick concept cards",
        tags: ["flashcards", "review"],
      },
      {
        id: "4-3",
        title: "Mock Interview Questions",
        file: "day4-review/03-mock-interview-questions.md",
        duration: "60-75 min",
        description: "Practice out loud",
        tags: ["interview", "practice"],
      },
      {
        id: "4-4",
        title: "Weak Spot Refinement",
        file: "day4-review/04-weak-spot-templates.md",
        duration: "45-60 min",
        description: "Clean up rambling answers",
        tags: ["interview", "polish"],
      },
    ],
  },
];

export const techStack = {
  backend: ["Python", "FastAPI", "PostgreSQL", "SQLAlchemy"],
  frontend: ["React", "TypeScript"],
  infrastructure: ["Kubernetes", "Docker", "Redis", "RabbitMQ"],
  integration: ["SLURM (HPC)", "Metrics Logging"],
};

export const coreEndpoints = [
  { method: "GET", path: "/experiments", description: "List experiments" },
  { method: "POST", path: "/experiments", description: "Create experiment" },
  { method: "GET", path: "/experiments/{id}", description: "Get experiment with runs" },
  { method: "POST", path: "/runs/{id}/metrics", description: "Log metrics" },
];

export const readinessChecklist = [
  "Explain the project in under 2 minutes",
  "Draw the architecture on a whiteboard",
  "Discuss any technology choice with reasoning",
  'Debug a "pod failing" scenario step-by-step',
  'Answer "how would you scale this?" concretely',
];
