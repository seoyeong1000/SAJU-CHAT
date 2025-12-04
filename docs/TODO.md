- [x] Swiss Ephemeris 엔진 셋업

  - [x] `pnpm add swisseph-v2 date-chinese` 기본 설치, Windows 빌드 실패 시 `swisseph-wasm` 대체 패키지 준비
  - [x] `public/ephe/`에 ephemeris 데이터(sepl_18.se1 등) 내려받아 배치하고 README/docs에 경로 안내
  - [x] `lib/bazi/engine.ts` 생성: swisseph-v2 기본 + swisseph-wasm fallback 로더, `swe_set_ephe_path(process.cwd() + "/public/ephe")` 초기화, `testSwissConnection()`에서 2024-02-04 12:00:00 UTC 율리우스일 예제 반환하도록 구현

- [x] API 라우트 구현

  - [x] POST `/api/bazi`: 요청 스키마(localWallTime, tzid, lon/lat, options) 검증, 응답에 raw_chart/meta/flags 포함
  - [x] Swiss 계산 실패 시 `fallbackStrategy` 분기: allowApprox → date-chinese 사용/flags 기록, strict → 500 반환
  - [x] `/api/bazi-test` 또는 유사 경로에서 `testSwissConnection` 결과 노출

- [ ] 시간/천문 계산 로직

  - [x] `localWallTime + tzid → UTC` 변환( date-fns-tz 또는 luxon ), `swe_julday`로 julianDayUTC 생성
  - [x] `swe_calc_ut` 태양 황경으로 월지 판정: 315° 시작, 30° 구간 경계 분/초 단위 처리
  - [x] 진태양시(TST) 계산: 경도+EoT 보정(Spencer 1971 근사식 fallback), `zishiSplit`(traditional/modern) 옵션별 시주/일주 결정
  - [x] lon/lat 또는 hour 누락 시 flags.locationUnknown/hourUnknown 처리

- [ ] DB 스키마(Supabase) 마이그레이션

  - [x] `astro_request`, `astro_result`, `astro_error_log` 테이블 생성 및 인덱스(요청별/created_at)
  - [x] Dev 단계 RLS 비활성화, Prod 전환 시 owner_id 기반 RLS 별도 마이그레이션 계획 메모

- [ ] 환경 변수/문서 정리
  - [x] `.env.example`에 `ENGINE_MODE`, `FALLBACK_STRATEGY`, ephe 경로 관련 주석 추가
  - [x] README/docs에 설치 명령, ephe 다운로드 방법, Windows 빌드 실패 시 wasm fallback 절차 기록
  - [x] /bazi-test 등 결과 확인용 UI/페이지 추가 지침 반영
