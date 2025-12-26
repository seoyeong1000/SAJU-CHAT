/**
 * 양력 → 음력 변환 유틸리티
 * date-chinese 라이브러리 사용
 */

import { CalendarChinese } from "date-chinese";

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  lunarDateString: string; // "YYYY/MM/DD" 형식
}

/**
 * 양력 날짜를 음력으로 변환
 * @param solarDate - 양력 Date 객체 또는 "YYYY-MM-DD" 문자열
 * @returns 음력 날짜 정보
 */
export function solarToLunar(solarDate: Date | string): LunarDate | null {
  try {
    const date = typeof solarDate === "string" ? new Date(solarDate) : solarDate;

    if (isNaN(date.getTime())) {
      return null;
    }

    const cal = new CalendarChinese();
    cal.fromGregorian(
      date.getFullYear(),
      date.getMonth() + 1, // JavaScript는 0-based month
      date.getDate()
    );

    const lunarYear = cal.get().year;
    const lunarMonth = cal.get().month;
    const lunarDay = cal.get().day;
    const isLeapMonth = cal.get().leap === 1;

    // 음력 날짜 문자열 포맷팅
    const lunarDateString = `${lunarYear}/${String(lunarMonth).padStart(2, "0")}/${String(lunarDay).padStart(2, "0")}`;

    return {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      isLeapMonth,
      lunarDateString,
    };
  } catch (error) {
    console.error("Lunar conversion error:", error);
    return null;
  }
}

/**
 * 음력 날짜를 양력으로 변환
 * @param lunarYear - 음력 년도
 * @param lunarMonth - 음력 월
 * @param lunarDay - 음력 일
 * @param isLeapMonth - 윤달 여부
 * @returns 양력 Date 객체
 */
export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth: boolean = false
): Date | null {
  try {
    const cal = new CalendarChinese();
    cal.set(60, lunarYear % 60 || 60, lunarMonth, isLeapMonth ? 1 : 0, lunarDay);

    const gregorian = cal.toGregorian();
    return new Date(gregorian.year, gregorian.month - 1, gregorian.day);
  } catch (error) {
    console.error("Solar conversion error:", error);
    return null;
  }
}
