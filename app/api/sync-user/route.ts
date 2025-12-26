import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Clerk 사용자를 Supabase users 및 profiles 테이블에 동기화하는 API
 *
 * 클라이언트에서 로그인 후 이 API를 호출하여 사용자 정보를 Supabase에 저장합니다.
 * 이미 존재하는 경우 업데이트하고, 없으면 새로 생성합니다.
 *
 * - users 테이블: 기본 사용자 정보 (clerk_id, name)
 * - profiles 테이블: 확장 프로필 정보 (saju_charts 등에서 FK로 참조)
 */
export async function POST() {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clerk에서 사용자 정보 가져오기
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabase = getServiceRoleClient();
    const displayName =
      clerkUser.fullName ||
      clerkUser.username ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      "Unknown";
    const email = clerkUser.emailAddresses[0]?.emailAddress || null;

    // 1. users 테이블에 동기화
    const { data: userData, error: usersError } = await supabase
      .from("users")
      .upsert(
        {
          clerk_id: clerkUser.id,
          name: displayName,
        },
        {
          onConflict: "clerk_id",
        }
      )
      .select()
      .single();

    if (usersError) {
      console.error("Supabase users sync error:", usersError);
      return NextResponse.json(
        { error: "Failed to sync user", details: usersError.message },
        { status: 500 }
      );
    }

    // 2. profiles 테이블에 동기화 (saju_charts.owner_id FK 참조용)
    const { error: profilesError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: clerkUser.id, // profiles.id = clerk user id (TEXT)
          email: email,
          display_name: displayName,
          role: "user",
        },
        {
          onConflict: "id",
        }
      );

    if (profilesError) {
      console.error("Supabase profiles sync error:", profilesError);
      // profiles 동기화 실패해도 users는 성공했으므로 경고만 반환
      return NextResponse.json({
        success: true,
        user: userData,
        warning: "profiles sync failed: " + profilesError.message,
      });
    }

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Sync user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
