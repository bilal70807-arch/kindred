"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  postId: string;
  posterId: string;
  existingConvId?: string;
};

export default function StartConversationButton({ postId, posterId, existingConvId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (existingConvId) {
      router.push(`/conversations/${existingConvId}`);
      return;
    }

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

    const { data, error: insertError } = await supabase
      .from("conversations")
      .insert({ post_id: postId, poster_id: posterId, trader_id: user.id })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create conversation:", insertError);
      setError(insertError.message);
      setLoading(false);
      return;
    }

    if (data) {
      router.push(`/conversations/${data.id}`);
    } else {
      setError("No conversation ID returned — please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium py-3 rounded-full transition-colors"
      >
        {loading
          ? "Opening…"
          : existingConvId
          ? "Continue conversation →"
          : "I'm interested — reach out"}
      </button>
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
