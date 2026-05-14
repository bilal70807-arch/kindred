"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ThanksPrompt from "./ThanksPrompt";

type Message = { id: string; body: string; sender_id: string; created_at: string };
type Conversation = {
  id: string;
  poster_id: string;
  trader_id: string;
  poster_agreed: boolean;
  trader_agreed: boolean;
};
type Profile = { id: string; username: string };

type Props = {
  conversation: Conversation;
  initialMessages: Message[];
  currentUserId: string;
  profiles: Profile[];
};

export default function ChatView({ conversation: initial, initialMessages, currentUserId, profiles }: Props) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conv, setConv] = useState(initial);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [agreeing, setAgreeing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isPosters = currentUserId === conv.poster_id;
  const myAgreed = isPosters ? conv.poster_agreed : conv.trader_agreed;
  const locked = conv.poster_agreed && conv.trader_agreed;
  const otherId = isPosters ? conv.trader_id : conv.poster_id;
  const otherName = profiles.find((p) => p.id === otherId)?.username ?? "them";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`conv:${conv.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conv.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${conv.id}` },
        (payload) => setConv(payload.new as Conversation)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conv.id]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: currentUserId,
      body: body.trim(),
    });
    setBody("");
    setSending(false);
  }

  async function handleAgree() {
    setAgreeing(true);
    const field = isPosters ? "poster_agreed" : "trader_agreed";
    await supabase.from("conversations").update({ [field]: true }).eq("id", conv.id);
    setAgreeing(false);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {locked && (
        <div className="shrink-0 bg-emerald-50 border-b border-emerald-100 px-4 py-3 text-center">
          <p className="font-semibold text-emerald-800 text-sm">Trade locked in</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            You&apos;ve both agreed. Time to make it happen.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-stone-300 text-sm pt-8">
            Say hello — start the conversation.
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-amber-500 text-white rounded-br-sm"
                    : "bg-white border border-stone-100 text-stone-700 rounded-bl-sm shadow-sm"
                }`}
              >
                {msg.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!locked && (
        <div className="shrink-0 border-t border-stone-100 px-4 py-3 text-center">
          {myAgreed ? (
            <p className="text-sm text-stone-400">
              You&apos;re in — waiting for {otherName} to agree
            </p>
          ) : (
            <div className="space-y-1">
              <button
                onClick={handleAgree}
                disabled={agreeing}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold px-8 py-2 rounded-full transition-colors text-sm"
              >
                {agreeing ? "Confirming…" : "I'm In"}
              </button>
              <p className="text-xs text-stone-300">Tap when you&apos;re ready to commit to this trade</p>
            </div>
          )}
        </div>
      )}

      {!locked ? (
        <form onSubmit={sendMessage} className="shrink-0 border-t border-stone-100 px-4 py-3 flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Say something…"
            className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            Send
          </button>
        </form>
      ) : (
        <ThanksPrompt
          conversationId={conv.id}
          currentUserId={currentUserId}
          toUserId={otherId}
          toName={otherName}
        />
      )}
    </div>
  );
}
