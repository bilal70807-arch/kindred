import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type Post = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, body, created_at")
    .eq("is_open", true)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 flex-1">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-stone-800 leading-snug">
          What's on the board
        </h1>
        <p className="text-stone-500 mt-2 text-base">
          Real people, real trades. No money — just things worth swapping.
        </p>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-stone-400 text-lg">The board is empty.</p>
          <Link
            href="/posts/new"
            className="inline-block mt-3 text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            Be the first to post something →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {(posts as Post[]).map((post) => (
            <article
              key={post.id}
              className="bg-white border border-stone-100 rounded-2xl px-6 py-5 shadow-[0_1px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-shadow"
            >
              <h2 className="text-lg font-semibold text-stone-800 leading-snug">
                {post.title}
              </h2>
              <p className="text-stone-500 mt-2 text-sm leading-relaxed line-clamp-3">
                {post.body}
              </p>
              <p className="mt-4 text-xs text-stone-300">{timeAgo(post.created_at)}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
