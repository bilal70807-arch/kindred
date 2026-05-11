"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("posts").insert({
      title,
      body,
      user_id: user.id,
      status: "open",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 flex-1">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800">Put something on the board</h1>
        <p className="text-stone-500 mt-2 text-base">
          Write it like you&apos;d tell a neighbour. The simpler, the better.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            The one-liner
          </label>
          <input
            type="text"
            placeholder="e.g. Sourdough loaves for guitar lessons"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Tell the story
          </label>
          <textarea
            placeholder="What are you offering, what would you love in return, anything useful to know..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={6}
            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 transition resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex items-center gap-4 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-full transition-colors"
          >
            {loading ? "Posting…" : "Post it"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
          >
            cancel
          </button>
        </div>
      </form>
    </main>
  );
}
