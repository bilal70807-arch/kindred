import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-10 border-b border-amber-100 bg-[#FBF8F2]/90 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-xl font-bold tracking-tight text-stone-800">kindred</span>
          <span className="text-[11px] text-stone-400 tracking-wide">barter with your neighbours</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/posts/new"
                className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
              >
                + new post
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-stone-400 hover:text-stone-700 transition-colors"
                >
                  sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-stone-500 hover:text-stone-800 transition-colors"
            >
              sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
