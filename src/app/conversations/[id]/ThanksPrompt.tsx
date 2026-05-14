"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  conversationId: string;
  currentUserId: string;
  toUserId: string;
  toName: string;
};

export default function ThanksPrompt({ conversationId, currentUserId, toUserId, toName }: Props) {
  const [checked, setChecked] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("thanks")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("from_user_id", currentUserId)
      .maybeSingle()
      .then(({ data }) => {
        setAlreadySent(!!data);
        setChecked(true);
      });
  }, [conversationId, currentUserId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("thanks").insert({
      conversation_id: conversationId,
      from_user_id: currentUserId,
      to_user_id: toUserId,
      body: body.trim(),
    });
    if (insertError) {
      console.error("Failed to submit thanks:", insertError);
      setError(insertError.message);
      setSubmitting(false);
    } else {
      setDone(true);
    }
  }

  if (!checked) return null;

  if (alreadySent || done) {
    return (
      <div className="shrink-0 border-t border-amber-100 bg-amber-50/40 px-4 py-4 text-center">
        <p className="text-sm text-amber-700 font-medium">
          Your thanks is on their wall. The deal is done.
        </p>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-amber-100 bg-amber-50/60 px-4 py-5">
      <p className="text-sm font-semibold text-stone-700 mb-0.5">
        Leave a note for {toName}
      </p>
      <p className="text-xs text-stone-400 mb-3">
        This will be public on their Wall of Thanks — say what made this trade good.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`What was it like trading with ${toName}?`}
          rows={3}
          className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none transition"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors"
        >
          {submitting ? "Sending…" : "Send thanks"}
        </button>
      </form>
    </div>
  );
}
