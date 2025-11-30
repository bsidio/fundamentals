import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Home } from "lucide-react";
import { getTopicById, getTopicContent, getAllTopicIds, getAdjacentTopics } from "@/lib/content";
import { MarkdownContent } from "@/components/MarkdownContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const ids = getAllTopicIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = getTopicById(id);

  if (!result) {
    return { title: "Topic Not Found" };
  }

  return {
    title: `${result.topic.title} | Study Plan`,
    description: result.topic.description,
  };
}

export default async function TopicPage({ params }: PageProps) {
  const { id } = await params;
  const result = getTopicById(id);

  if (!result) {
    notFound();
  }

  const { topic, day } = result;
  const content = getTopicContent(topic.file);
  const { prev, next } = getAdjacentTopics(id);

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Navigation header */}
        <nav className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Study Plan</span>
          </Link>

          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Day {day.id}</span>
            <span>·</span>
            <span>{day.title}</span>
          </div>
        </nav>

        {/* Topic header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {topic.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] rounded-full bg-bg border border-border text-text-muted uppercase tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-semibold text-text mb-2">
            {topic.title}
          </h1>
          <p className="text-text-secondary mb-3">{topic.description}</p>
          <div className="flex items-center gap-1.5 text-sm text-text-muted">
            <Clock className="w-4 h-4" />
            <span>{topic.duration}</span>
          </div>
        </header>

        {/* Content */}
        <article className="terminal-card p-6 md:p-8 mb-8">
          <MarkdownContent content={content} />
        </article>

        {/* Navigation footer */}
        <nav className="flex items-center justify-between pt-4 border-t border-border">
          {prev ? (
            <Link
              href={`/topic/${prev.id}`}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <div className="text-left">
                <div className="text-xs text-text-muted">Previous</div>
                <div>{prev.title}</div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {next ? (
            <Link
              href={`/topic/${next.id}`}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors group"
            >
              <div className="text-right">
                <div className="text-xs text-text-muted">Next</div>
                <div>{next.title}</div>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </main>
    </div>
  );
}
