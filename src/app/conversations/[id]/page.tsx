import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ChatView from "./ChatView";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, post_id, poster_id, trader_id, poster_agreed, trader_agreed")
    .eq("id", id)
    .single();

  if (!conversation) redirect("/");
  if (conversation.poster_id !== user.id && conversation.trader_id !== user.id) redirect("/");

  const [{ data: messages }, { data: profiles }, { data: post }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, body, sender_id, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, username")
      .in("id", [conversation.poster_id, conversation.trader_id]),
    supabase
      .from("posts")
      .select("body")
      .eq("id", conversation.post_id)
      .single(),
  ]);

  return (
    <main className="flex-1 flex flex-col min-h-0 max-w-2xl w-full mx-auto">
      <div className="shrink-0 px-4 py-3 border-b border-stone-100 bg-[#FBF8F2]">
        <Link href="/" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          ← board
        </Link>
        <p className="text-sm text-stone-500 mt-1 line-clamp-2 leading-snug">{post?.body}</p>
      </div>

      <ChatView
        conversation={conversation}
        initialMessages={messages ?? []}
        currentUserId={user.id}
        profiles={profiles ?? []}
      />
    </main>
  );
}
