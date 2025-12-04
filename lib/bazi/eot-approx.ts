/**
 * Equation of Time 근사 계산 (swisseph 의존 없이 사용)
 * Spencer(1971) 푸리에 급수 근사식
 * 예상 정확도: ±0.5분
 *
 * 반환 단위: 분 (minutes)
 */
export const calculateEoT = (julianDay: number): number => {
  const daysSinceJ2000 = julianDay - 2451545.0;

  // 평균 황경 / 근점이각 (라디안)
  const meanLongitude = ((280.460 + 0.9856474 * daysSinceJ2000) * Math.PI) / 180;
  const meanAnomaly = ((357.528 + 0.9856003 * daysSinceJ2000) * Math.PI) / 180;

  // Spencer (1971) 근사식 (분 단위)
  // 참고: 계수는 분 단위 결과를 반환하도록 정의됨
  const eotMinutes =
    -7.659 * Math.sin(meanLongitude) +
    9.863 * Math.sin(2 * meanLongitude + 3.5932) -
    1.5 * Math.sin(meanAnomaly); // 추가 하모닉으로 약간 보정

  return eotMinutes;
};

/**
 * 표준 자오선(시간대 기준 경도)에서의 경도 오차 보정치를 분 단위로 계산.
 * @param longitude 경도(동경 +)
 * @param tzOffsetMinutes 타임존 오프셋(분, 예: KST=540)
 */
export const calculateLongitudeOffset = (longitude: number, tzOffsetMinutes: number): number => {
  const standardMeridianDeg = tzOffsetMinutes / 4; // 4분/도
  return (longitude - standardMeridianDeg) * 4;
};
