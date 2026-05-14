import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: thanksList } = await supabase
    .from("thanks")
    .select("id, body, created_at, from_user_id")
    .eq("to_user_id", id)
    .order("created_at", { ascending: false });

  const fromIds = [...new Set((thanksList ?? []).map((t) => t.from_user_id))];
  const { data: senders } =
    fromIds.length > 0
      ? await supabase.from("profiles").select("id, username").in("id", fromIds)
      : { data: [] };

  const senderMap = Object.fromEntries((senders ?? []).map((s) => [s.id, s.username]));
  const count = thanksList?.length ?? 0;

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="text-sm text-stone-400 hover:text-stone-600 mb-10 inline-block transition-colors"
        >
          ← back to board
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-stone-800 break-all">{profile.username}</h1>
          <p className="text-stone-400 mt-2 text-base">
            {count === 0
              ? "No trades yet — the wall is waiting."
              : `${count} ${count === 1 ? "person has" : "people have"} traded here and left their thanks.`}
          </p>
        </div>

        {count === 0 && (
          <div className="border border-dashed border-stone-200 rounded-2xl px-6 py-12 text-center">
            <p className="text-stone-300 text-sm leading-relaxed">
              Every trade leaves a mark.<br />
              This is where they&apos;ll live.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {(thanksList ?? []).map((thank) => {
            const fromName = senderMap[thank.from_user_id] ?? "someone";
            return (
              <article
                key={thank.id}
                className="bg-white border border-stone-100 rounded-2xl px-6 py-6 shadow-sm"
              >
                <blockquote className="text-stone-700 leading-relaxed text-base">
                  &ldquo;{thank.body}&rdquo;
                </blockquote>
                <footer className="mt-5 flex items-center justify-between">
                  <span className="text-sm text-stone-400">— {fromName}</span>
                  <time className="text-xs text-stone-300">
                    {new Date(thank.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
