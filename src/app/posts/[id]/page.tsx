import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StartConversationButton from "./StartConversationButton";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post } = await supabase
    .from("posts")
    .select("id, body, user_id, created_at")
    .eq("id", id)
    .single();

  if (!post) redirect("/");

  const isOwner = user?.id === post.user_id;

  const { data: conversations } = isOwner
    ? await supabase
        .from("conversations")
        .select("id, poster_agreed, trader_agreed")
        .eq("post_id", id)
    : { data: null };

  const { data: existingConv } = !isOwner && user
    ? await supabase
        .from("conversations")
        .select("id")
        .eq("post_id", id)
        .eq("trader_id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="text-sm text-stone-400 hover:text-stone-600 mb-6 inline-block transition-colors">
          ← back to board
        </Link>

        <article className="bg-white border border-stone-100 rounded-2xl px-6 py-6 shadow-sm mb-8">
          <p className="text-stone-700 leading-relaxed">{post.body}</p>
          <p className="mt-5 text-xs text-stone-300">
            {new Date(post.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </article>

        {isOwner && (
          <div>
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
              {conversations?.length === 0
                ? "No one's reached out yet"
                : `${conversations?.length} conversation${conversations?.length === 1 ? "" : "s"}`}
            </h2>
            <div className="space-y-2">
              {conversations?.map((conv) => {
                const locked = conv.poster_agreed && conv.trader_agreed;
                return (
                  <Link
                    key={conv.id}
                    href={`/conversations/${conv.id}`}
                    className="flex items-center justify-between bg-white border border-stone-100 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow text-sm"
                  >
                    <span className="text-stone-600">Open conversation</span>
                    {locked ? (
                      <span className="text-xs text-emerald-600 font-medium">Locked in</span>
                    ) : (
                      <span className="text-xs text-stone-300">In progress</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {!isOwner && user && (
          <StartConversationButton
            postId={post.id}
            posterId={post.user_id}
            existingConvId={existingConv?.id}
          />
        )}

        {!isOwner && !user && (
          <div className="text-center py-4">
            <Link
              href="/login"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-full transition-colors"
            >
              Sign in to reach out
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
