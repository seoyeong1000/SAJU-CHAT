📘 Bazi Ephemeris Engine PRD – Final v2.2
0. 문서 정보

프로젝트명: Bazi Ephemeris Engine (만세력 계산 코어)

버전: v2.2 Final

작성자: PM/CTO

대상: 백엔드 개발자, 인프라 엔지니어, AI 에이전트(Cursor/Codex)

목표:

Swiss Ephemeris 기반 정밀 만세력 엔진을 Next.js + Node 환경에서 안정적으로 돌린다.

윈도우 개발 환경 + 리눅스(AWS/Railway) 배포 환경 모두 동일 코드로 동작하게 한다.

개발 단계에서는 RLS 비활성화, 운영 전환 시에만 RLS를 켜는 전략을 명확히 한다.

이 PRD는 **“만세력/천문 계산 엔진”**만 다룹니다.
사주 풀이(통변) 룰엔진, 사주 채팅봇은 별도 PRD(v1.x, v3.x)에서 정의.

1. 설계 방향 요약 (Architecture Summary)
1.1 기존 안 vs 최종 안

❌ 기존 안:

Windows 전용 swetest.exe 바이너리를 child_process로 호출.

C 코드를 TypeScript로 직접 포팅 시도.

✅ 최종 안:

NPM Swiss Ephemeris 라이브러리(Node 바인딩/wasm)를 사용.

OS 독립적으로 동작하도록 설계 (Windows Dev ↔ Linux Prod 동일 코드).

1.2 기술 스택

런타임: Node.js (Next.js 15 App Router, API Route)

만세력 엔진:

1순위: swisseph-v2
 
packages.ecosyste.ms

2순위(윈도우 빌드 실패 시): swisseph-wasm 
packages.ecosyste.ms

보조 엔진(백업): date-chinese (단순 간지 계산용)

DB: Supabase(PostgreSQL)

인증/연동: Clerk ↔ Supabase (이 PRD에서는 세부 인증 로직은 범위 밖)

1.3 금지 사항 (Hard NO)

❌ Swiss C 코드를 TypeScript로 직접 포팅(C → TS 변환)
→ 정밀도 망가질 위험이 크므로 절대 금지.

❌ .exe 바이너리 업로드 후 child_process.exec로 호출
→ 리눅스 컨테이너/서버리스에서 깨질 가능성이 큼.

✅ 반드시 NPM 패키지(swisseph-v2 / swisseph-wasm) 를 사용해 호출할 것.

2. Cursor / Codex용 개발 지시문

이 섹션은 그대로 복붙해서 Cursor에게 주는 용도입니다.

2.1 방향 전환 설명
PRD에는 원래 Windows용 EXE(swetest.exe)를 child_process로 실행하는 방식이 있었는데,
배포 환경이 AWS나 Railway 같은 리눅스/컨테이너가 될 것이기 때문에
이제는 .exe 파일을 직접 실행하지 않고,

Node.js 용 Swiss Ephemeris 라이브러리를 npm으로 설치해서 사용하는 방식으로 변경한다.

2.2 Cursor에 줄 프롬프트 예시 ① (엔진 세팅)
생각해보니 나중에 AWS나 Railway(리눅스 환경)에 배포해야 해서,
`.exe` 파일을 직접 실행하는 방식은 관리가 어려울 것 같아.

대신, Node.js용 Swiss Ephemeris 라이브러리(`swisseph-v2` 우선, 안되면 `swisseph-wasm`)를
npm으로 설치해서 사용하는 방식으로 구현해줘.

1. `package.json`에 `swisseph-v2`를 추가해줘.
   - 만약 내 개발 PC(Windows)에서 native 빌드가 실패하면, 자동으로 `swisseph-wasm` 버전으로 대체해줘.

2. `lib/bazi/engine.ts` 파일을 만들어서,
   - `swisseph-v2` (또는 fallback으로 `swisseph-wasm`)를 import해서 사용하는 구조로 작성해줘.
   - 절대로 `child_process`로 exe를 부르지 말고, 라이브러리 함수를 직접 호출하는 방식으로 만들어줘.

3. Ephemeris 데이터 파일(ephe)은 프로젝트 내의 `public/ephe` 폴더에 둘 예정이야.
   - 라이브러리 초기화 시 `swe_set_ephe_path` 같은 함수를 사용해서
     이 경로를 바라보도록 설정해줘.

이렇게 하면 Windows 개발환경과 Linux 배포환경 모두에서
코드 수정 없이 동일하게 동작할 수 있게 해줘.

2.3 Cursor에 줄 프롬프트 예시 ② (테스트 함수)
`swisseph-v2`를 잘 설치했다면, 다음 작업을 해줘.

1. 터미널에서 `pnpm add swisseph-v2 date-chinese` 를 실행하는 스크립트/명령어를 README나 docs에 추가해줘.

2. 설치가 끝났다고 가정하고,
   `lib/bazi/engine.ts` 안에 아래 내용을 포함한 테스트 함수를 만들어줘.

   - `swisseph.swe_julday` 를 사용해서
     2024-02-04 12:00:00 UTC 의 율리우스일(Julian day)을 계산하는 예제
   - `swisseph.swe_set_ephe_path(process.cwd() + "/public/ephe")` 로 경로를 세팅하는 코드
   - 계산 결과를 반환하는 `testSwissConnection()` 같은 함수

3. 이 함수는 나중에 `/api/bazi-test` 같은 라우트에서 호출할 수 있게
   export 해줘.

3. 입력/출력 스펙 (API Spec)
3.1 Endpoint

URL: POST /api/bazi

역할:

사용자가 입력한 출생 시각 + 장소 정보를 받아

월주/일주/시주를 포함한 **원시 천문 데이터(raw_chart)**를 반환한다.

3.2 요청 스키마 (Request JSON)
{
  "localWallTime": "2024-02-04T16:30:00",   // 필수: 사용자가 본 벽시계 시각 (초까지 허용)
  "tzid": "Asia/Seoul",                     // 필수: IANA Time Zone
  "lon": 126.9780,                          // 선택: 경도(+동경). 없으면 진태양시 계산 X
  "lat": 37.5665,                           // 선택: 위도(+북위). v1에서는 메타로만 사용
  "options": {
    "useTrueSolarTime": true,               // 진태양시 적용 여부 (기본 true)
    "zishiSplit": "traditional",            // 'traditional' | 'modern'
    "fallbackStrategy": "allowApprox"       // 'allowApprox' | 'strict'
  }
}


주의:

localWallTime은 항상 사용자의 “지역 시간” 기준.

UTC로 들어오는 값이 아님. 변환은 서버에서 tzid를 사용해 처리.

3.3 응답 스키마 (Response JSON, 개요)
{
  "yearPillar": "갑자",
  "monthPillar": "을축",
  "dayPillar": "무인",
  "hourPillar": "경자",
  "raw": {
    "julianDayUTC": 2460345.5,
    "sunLongitude": 315.1234
  },
  "flags": {
    "usedTrueSolarTime": true,
    "usedFallbackEngine": false,
    "hourUnknown": false,
    "locationUnknown": false
  },
  "meta": {
    "engine": "swiss-v2 | swisseph-wasm | date-chinese",
    "note": "월지=태양황경(절기), 시주=진태양시(경도+EoT)",
    "debug": {
      "tzid": "Asia/Seoul",
      "tzOffsetMin": 540,
      "lon": 126.978,
      "localWallISO": "2024-02-04T16:30:00",
      "utcISO": "2024-02-04T07:30:00Z",
      "tstLocal": "2024-02-04T16:38:12",
      "eotMin": -1.3
    }
  }
}

4. 로직 상세 (월주/시주/진태양시)
4.1 시간대/UTC 변환

localWallTime + tzid → UTC 변환

date-fns-tz 또는 luxon 계열 라이브러리 사용 (내부 구현 선택).

역사적 DST(썸머타임)는 tzid가 알아서 처리.

UTC 시각 → swisseph의 swe_julday/swe_calc_ut에 전달.

4.2 월주(月柱) 계산 (태양 황경 기반)

swisseph.swe_calc_ut(julianDayUTC, SE_SUN, ...)로 태양 황경 λ☉ 계산.

315°를 입춘(寅월)의 시작점으로 두고, 30° 구간으로 월지 판정:

[315°, 345°) → 寅

[345°, 15°) → 卯

[15°, 45°) → 辰

…

경계 처리:

절입 시각을 분/초 단위까지 계산하고,

출생 시각이 절입 시각 이후이면 새 달로 판정.

4.3 시주(時柱) & 자시 정책

진태양시(True Solar Time) 계산:

lon이 있으면:

표준시 기준에서 경도 보정 + EoT(시방정식)를 더해 TST 산출.

lon이 없으면:

flags.usedTrueSolarTime = false로 두고, 표준시 기준으로만 시주 계산.

zishiSplit 옵션:

traditional (기본값)

TST 기준 23:00부터 다음 날 일진을 적용.

23:00~01:00 = 자시, 일주는 다음 날.

modern

23:00~24:00 = 야자시 (일주는 오늘, 시지는 자시)

00:00~01:00 = 조자시 (일주는 내일, 시지는 자시)

5. 예외 처리 & Fallback 전략
5.1 Swiss 엔진 실패 시

swisseph-v2 로딩 실패, ephe 파일 누락, 계산 오류 등 발생 시:

fallbackStrategy === "allowApprox"이면:

date-chinese 라이브러리로 월주/일주/시주 단순 계산.

flags.usedFallbackEngine = true

meta.engine = "date-chinese"

meta.debug.error 필드에 Swiss 에러 메시지 기록.

fallbackStrategy === "strict"이면:

HTTP 500 + 에러 메시지 반환.

DB에 에러 로그 남김.

5.2 생시/장소 미상

생시 모름:

프론트에서 시간 입력을 null/unknown으로 보낼 수 있게 하고,

백엔드에서 hourPillar = null, flags.hourUnknown = true.

장소 모름:

lon, lat 누락 → flags.locationUnknown = true,

진태양시(TST)는 계산하지 않고, 표준시로만 시주 계산.

6. DB 설계 & RLS 정책
6.1 테이블 개요

Dev 단계에서는 RLS 전부 비활성화. Prod 전환 시 별도 마이그레이션으로 활성화.

astro_request

id (uuid, pk)

input_json (jsonb)

created_at (timestamptz)

astro_result

id (uuid, pk)

request_id (uuid, fk → astro_request.id)

output_json (jsonb)

engine_type (text) — 'swiss-v2' | 'swisseph-wasm' | 'date-chinese'

created_at (timestamptz)

astro_error_log

id (uuid, pk)

request_id (nullable, fk)

error_message (text)

stack (text)

created_at (timestamptz)

6.2 인덱스

astro_request (created_at DESC)

astro_result (request_id)

필요 시 astro_result (created_at DESC) 추가

6.3 RLS 전략

Dev / Stage:

ALTER TABLE ... DISABLE ROW LEVEL SECURITY;

개발 편의를 위해 anon key로도 read/write 가능.

Prod:

owner_id 컬럼 추가 후,
owner_id = auth.jwt()->>'sub' 기반 RLS 정책 별도 PRD/마이그레이션에서 정의.

7. 설치 & 개발 가이드
7.1 패키지 설치
# Swiss Ephemeris & 보조 엔진
pnpm add swisseph-v2 date-chinese

# Windows에서 빌드가 실패하면 (node-gyp 에러 등)
pnpm add swisseph-wasm

7.2 Ephemeris 데이터 파일

Swiss Ephemeris 공식 사이트에서 ephe 파일 다운

sepl_18.se1, semo_18.se1, seas_18.se1, sefstars.se1 등

프로젝트 루트에 public/ephe/ 생성 후 복사.

초기화 코드 (예시):

import swe from "swisseph-v2";
// 또는 import swe from "swisseph-wasm";

swe.swe_set_ephe_path(process.cwd() + "/public/ephe");

7.3 환경 변수 예시
ENGINE_MODE=swiss          # swiss | date-chinese (fallback 엔진 선택)
FALLBACK_STRATEGY=allowApprox

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Dev에선 거의 사용 X, Prod에서 배치/관리용

8. 테스트 & 검증
8.1 벤치마크 케이스

입춘 경계:

2월 4일 16:28 vs 16:29 등, 분/초 차이로 월주 변화 확인.

썸머타임 적용 연도 (예: 1988년 한국):

tzid=Asia/Seoul 기준 DST 반영 여부 검증.

서울 vs 부산:

동일 시각, 다른 경도 → 진태양시 기준 시주 차이 확인.

장소/생시 모름:

lon, localWallTime 일부 누락 시 flags 처리와 오류 없는 응답 확인.

8.2 성능 목표

단건 /api/bazi 호출:

평균 200ms 이내 (swisseph 캐시/ephe 파일 로컬일 때).

Fallback 발생률:

전체 호출의 0.1% 미만.

9. Definition of Done (완료 기준)

 swisseph-v2 또는 swisseph-wasm을 사용해, Windows Dev + Linux Prod에서 동일 코드로 동작.

 /api/bazi에 대한 기본 벤치마크 케이스(입춘, DST, 서울/부산)가 기대값과 일치.

 Dev DB에서 RLS 비활성 상태로 로그/결과가 잘 저장됨.

 Prod 전환 시, RLS 정책은 별도 마이그레이션/PRD로 관리.

 /bazi-test 페이지 또는 유사 테스트 UI에서 JSON 결과와 debug 정보를 시각 확인 가능.