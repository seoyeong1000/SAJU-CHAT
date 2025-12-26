"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { TABLE_SAJU_CHARTS } from "@/lib/constants";

/**
 * 사주 정보를 처리하고 결과 페이지로 리다이렉트하는 서버 액션
 *
 * - 회원: DB에 저장 후 /mansaeryeok/result?id=xxx 로 리다이렉트
 * - 비회원: DB 저장 없이 URL 파라미터로 /mansaeryeok/result?birthDate=...&gender=... 로 리다이렉트
 */
export async function submitSajuForm(formData: FormData) {
  // 1. 인증 확인 (비회원도 허용)
  const { userId } = await auth();

  // 2. 폼 데이터 추출
  const name = formData.get("name") as string;
  const gender = formData.get("gender") as string | null;
  const birthYear = formData.get("birthYear") as string;
  const birthMonth = formData.get("birthMonth") as string;
  const birthDay = formData.get("birthDay") as string;
  const birthSijin = formData.get("birthSijin") as string | null;
  const calendarType = formData.get("calendarType") as string;
  const timeUnknown = formData.get("timeUnknown") === "true";
  const birthCity = formData.get("birthCity") as string | null;

  // 3. 날짜 포맷팅
  const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;

  // 시진에서 시간(hour) 추출 (예: "23:30" -> 23)
  let birthHour: string | null = null;
  if (!timeUnknown && birthSijin) {
    birthHour = birthSijin;
  }

  // ========================================
  // 비회원: URL 파라미터로 리다이렉트 (DB 저장 안 함)
  // ========================================
  if (!userId) {
    const params = new URLSearchParams();
    params.set("birthDate", birthDate);
    if (gender) params.set("gender", gender);
    if (birthHour) params.set("birthTime", birthHour);
    if (calendarType) params.set("calendarType", calendarType);
    if (timeUnknown) params.set("timeUnknown", "true");
    if (birthCity) params.set("city", birthCity);
    if (name) params.set("name", name);

    redirect(`/mansaeryeok/result?${params.toString()}`);
  }

  // ========================================
  // 회원: DB에 저장 후 ID로 리다이렉트
  // ========================================

  // 4. 입력 정보 저장용 JSON
  const inputJson = {
    birthDate,
    birthTime: birthSijin,
    calendarType,
    timeAccuracy: timeUnknown ? "unknown" : "exact",
    gender,
    city: birthCity,
  };

  // 시간 숫자 추출 (DB 저장용)
  let birthHourNum: number | null = null;
  if (!timeUnknown && birthSijin) {
    const hourPart = birthSijin.split(":")[0];
    birthHourNum = parseInt(hourPart, 10);
  }

  // 5. [임시] 만세력 계산 결과 (Mock Data)
  // 추후 실제 엔진이 연동될 예정이므로, 현재는 데이터 흐름 테스트를 위해 고정된 JSON을 저장함.
  const mockResultJson = {
    pillars: {
      year: { stem: "갑", branch: "진", full: "갑진" },
      month: { stem: "병", branch: "인", full: "병인" },
      day: { stem: "무", branch: "자", full: "무자" },
      hour: birthHourNum !== null ? { stem: "경", branch: "신", full: "경신" } : null,
    },
    dayMaster: {
      hangul: "무",
      hanja: "戊",
      element: "earth",
      yinYang: "yang",
    },
    solarTerm: {
      name: "입춘",
      hanja: "立春",
      date: "2024-02-04",
    },
    meta: {
      engineVersion: "mock-1.0.0",
      calculatedAt: new Date().toISOString(),
      julianDay: 2460000,
      sunLongitude: 315.0,
    },
    analysis: {
      ohhaeng: {
        percentage: {
          wood: 30,
          fire: 20,
          earth: 30,
          metal: 10,
          water: 10,
        },
      },
      personality:
        "아직 정밀 분석 엔진이 연결되지 않았습니다. 이것은 DB 연동 테스트용 데이터입니다.",
      strength: "데이터 저장 및 조회 성공",
      weakness: "실제 만세력 엔진 연동 필요",
    },
  };

  // 6. DB Insert (saju_charts 테이블)
  const supabase = await createClerkSupabaseClient();

  // birth_date를 ISO timestamp 형식으로 변환 (시간은 정오로 설정)
  const birthDateTimestamp = `${birthDate}T12:00:00.000Z`;

  // birth_hour는 TEXT 타입이므로 문자열로 변환
  const birthHourStr = birthHourNum !== null ? String(birthHourNum) : null;

  const { data, error } = await supabase
    .from(TABLE_SAJU_CHARTS)
    .insert({
      owner_id: userId,
      name: name || "이름 없음",
      gender: gender || "unknown", // NOT NULL 컬럼이므로 기본값 사용
      birth_date: birthDateTimestamp,
      birth_hour: birthHourStr,
      input_json: inputJson,
      result_json: mockResultJson,
      is_locked: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[Server Action] DB 저장 실패:", error);
    throw new Error("사주 정보를 저장하는 데 실패했습니다.");
  }

  // 7. 결과 페이지로 리다이렉트
  redirect(`/mansaeryeok/result?id=${data.id}`);
}
