import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import SupportClient from "./support-client";

export default async function SupportPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/support");
  }

  const supabase = createClerkSupabaseClient();

  // 내 문의 목록 조회
  const { data: posts, error } = await supabase
    .from("support_posts")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  return (
    <SupportClient
      userId={userId}
      initialPosts={posts ?? []}
      error={error?.message}
    />
  );
}
