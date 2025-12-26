# 서비스별 기능명세서 FINAL — n8n 워크플로우

- 버전: v1.1
- 최종 업데이트: 2025-12-21 (Asia/Seoul)
- 상태: FINAL

## 통합 패치 반영 메모

- 토큰/비용 규칙, 캐시 키, 요약 모드 스위치, JSON repair, alert/warn 규칙까지 포함

- 작성일: 2025-12-21
- 역할: 토큰 절약/품질/자동화 집행

## 강제 규칙

- 컨텍스트 예산 하드리밋 + 초과 시 요약 대체
- 요약: 10턴마다 + 누적 1500자 초과 즉시
- 캐시: TTL 7일, hit면 LLM 0회
- DB 조회: 턴당 3 레코드 제한
- JSON Repair + text_only failover(3회 연속 실패)

## 금지

- 과금/권한 판단은 Next.js만

---

# 부록: 공통 운영 요구사항(배포 가능 기준)

- 버전: v1.1
- 최종 업데이트: 2025-12-21 (Asia/Seoul)
- 상태: FINAL

# ✅ 비기능 필수 요구사항 (Non-Functional Requirements) — Saju Service (v1.0)

- 작성일: 2025-12-21
- 목적: 기능 구현 외에 **“배포 가능한 상태(Production-Ready)”**를 만들기 위한 공통 요구사항 체크리스트
- 적용 범위: PRD1(만세력) / PRD2(사주풀이) / PRD3(사주채팅) / /vault / 결제 / n8n 연동

---

## 개발자에게 전달할 “최종 점검용 프롬프트”(복붙)

아래 내용을 그대로 개발자(에이전트)에게 전달하세요.

> 서비스 출시를 위한 **비기능 필수 요구사항(Non-Functional Requirements)** 문서를 작성하고, 실제 코드에 반영해 주세요.  
> 아래 항목은 **Common Requirements 문서 + Global Layout(app/layout.tsx) + 공통 컴포넌트(footer/header) + 인프라 설정**에 반드시 포함되어야 합니다.  
> 각 항목은 “무엇을 / 어디에 / 어떻게” 구현할지까지 구체적으로 작성하고, 체크리스트 형태로 완료 여부를 표시할 수 있게 해 주세요.

---

## 1) Legal Pages (PG 심사 대비) — 필수

### 1.1 Footer 링크

- Footer에 다음 링크를 항상 노출:
  - `/terms` 이용약관
  - `/privacy` 개인정보처리방침

### 1.2 정적 페이지 구현

- Next.js App Router 기준:
  - `app/terms/page.tsx`
  - `app/privacy/page.tsx`
- 내용은 **정적 텍스트 placeholder**로 먼저 구성(추후 실제 문구로 교체)
- 페이지 하단에 “최종 수정일” 표기 영역 포함

### 1.3 PG 심사에서 자주 보는 추가 노출(권장)

- Footer 또는 `/terms` 내부에 다음 placeholder 영역 확보:
  - 상호/대표/사업자등록번호/통신판매업신고번호
  - 고객센터 연락처/이메일
  - 환불/취소 규정 링크(예: `/refund`)
    > PG사/플랫폼에 따라 요구사항이 달라서, 최소한 “자리를 확보”해두는 게 안전합니다.

---

## 2) SEO & Open Graph (공유 최적화) — 필수

### 2.1 Global Metadata

- `app/layout.tsx`에서 global metadata 설정:
  - `title`: "당신의 운명을 읽다, 000"
  - `description`: "정통 만세력과 AI 사주풀이로 보는 나의 운세"
  - `openGraph`:
    - `title`, `description`
    - `images`: `/og-default.png` (public)
  - `twitter`: summary_large_image 설정(가능하면)

### 2.2 OG 이미지 파일

- `public/og-default.png` 파일 존재 보장
- (권장) 페이지별 OG 커스터마이즈:
  - 만세력 결과/리포트 결과 페이지는 “개인정보 포함 금지”
  - 즉, **공유용 OG는 기본값 고정**이 안전

### 2.3 Robots/Index 정책(필수)

- 민감 페이지(리포트/채팅/보관함)는 noindex 권장
  - `/vault/**`, `/chat/**`, `/report/**` 등
- `robots.txt` 또는 metadata에서 페이지별 제어

---

## 3) Error Monitoring (Sentry) — 필수

### 3.1 Sentry SDK 연동 범위

- Next.js에서 Client/Server 모두 수집되도록 설정
  - 브라우저 에러 + 서버 에러 + API route 에러 + edge/서버리스 런타임 에러

### 3.2 민감정보 마스킹(필수)

- 다음 데이터는 Sentry 이벤트에서 마스킹/제외:
  - 생년월일/출생시간/출생지(차트 input_json)
  - 채팅 본문(content)
  - 결제 식별정보 일부(전체 카드/PG 민감정보)
- “사용자 식별”은 user_id 정도만(필요 시 해시)

### 3.3 릴리즈 태그/환경 분리(필수)

- env: `development` / `staging` / `production` 구분
- release 버전(커밋 해시 또는 배포 버전) 태깅

---

## 4) Support Channel — 필수

### 4.1 고객센터 노출

- Footer에 고객센터 이메일을 mailto로 노출:
  - `support@YOUR_DOMAIN`
- (권장) 운영시간/응답 SLA 문구 placeholder

### 4.2 피드백 위젯(선택)

- Channel.io 또는 Tally 등:
  - 스크립트 삽입 영역을 layout에 확보
  - 환경변수로 on/off 가능(Feature Flag)

---

## 5) Security & Abuse 방어 — “배포 가능”의 핵심

## 5.x 환경변수 템플릿(.env.example) — 필수(열쇠 꾸러미)

### 5.x.1 .env.example 강제

- 프로젝트 루트에 `.env.example` 파일을 **필수 포함**한다.
- 실제 키 값은 비워두되, 필요한 모든 Key 명칭과 용도를 주석으로 명시한다.

### 5.x.2 최소 포함 키 목록(예시)

- Supabase
  - `NEXT_PUBLIC_SUPABASE_URL=`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
  - `SUPABASE_SERVICE_ROLE_KEY=`
- n8n (Gateway → n8n)
  - `N8N_WEBHOOK_URL=`
  - `N8N_API_KEY=`
- 결제(Toss 예시)
  - `TOSS_SECRET_KEY=`
  - `TOSS_CLIENT_KEY=`
  - `TOSS_WEBHOOK_SECRET=`
- Sentry
  - `SENTRY_DSN=`
- Swiss Ephemeris(wasm) / Ephemeris 파일 경로
  - `SE_EPHE_PATH=public/ephe`
- 운영
  - `APP_BASE_URL=` (예: https://yourdomain.com)
  - `SUPPORT_EMAIL=` (예: support@yourdomain.com)

> 원칙: “키가 없으면 빌드/서버 부팅 단계에서 실패”하도록 체크를 둔다(배포 사고 방지).

### 5.1 인증/권한 경계(필수)

- 정책 고정:
  - 클라이언트 → n8n 직결 금지
  - Next.js Gateway에서만 n8n 호출
  - 유료 섹션 필터링/tier 판정은 Next.js 서버가 진실

### 5.2 Rate Limit / Bot 방어(필수)

- 최소 적용 대상:
  - `/api/mansaeryeok/calc`
  - `/api/interpretation/report`
  - `/api/chat/*` (상담)
- 기준 예시:
  - IP 기반 + 사용자 기반 혼합
  - 1분당 N회, 초과 시 429
- (권장) reCAPTCHA/Turnstile은 “결제/회원가입”에만 최소 적용

### 5.3 Idempotency (필수)

- 결제 후/리포트 생성/채팅 차감은 멱등 보장:
  - chat_messages `(owner_id, idempotency_key)` unique
  - credit_logs `(entitlement_id, reason, related_ref_id)` unique
  - report 생성은 “Bound+exists=return” 동작

---

## 6) Observability / 운영 로그 — 필수

### 6.1 서버 로그 표준(필수)

- 모든 API 응답에 `request_id` 포함(로그에도 동일 값)
- 필수 로그 필드:
  - request_id, user_id(optional), route, status_code, latency_ms, error_code(optional)

### 6.2 n8n 연동 로그(필수)

- n8n 호출 시:
  - workflow_name, run_id, cache_hit 여부, llm_called 여부, tokens_estimate(optional)

---

## 7) Data & Backups — 필수

## 7.x 초기 데이터 시딩(Seeding) — 필수(운영 준비물)

### 7.x.1 Seed Script 강제

- DB 스키마 생성 후, 서비스 구동에 필요한 **필수 데이터(사주 해석 텍스트/로직 상수 등)**를 자동 적재하는 스크립트를 반드시 제공한다.
- 실행 방식(고정):
  - `npm run seed`
- 원본 데이터(정답):

  - `data/conversation.csv` (CONVERSATION_SCRIPT)
  - `data/interpretation.csv` (INTERPRETATION_BASE)
  - `data/persona.csv` (PERSONA_VIBE_HOOK)
  - `data/solution.csv` (SOLUTION_ACTION)
  - **원문(@_.csv/@_.txt)에서 재추출하지 않는다.** 이 4개 CSV가 이미 “정제된 시트”이며 seed/스크립트 추출의 유일한 입력이다.

- 요구사항:
  - **멱등성**: seed를 여러 번 실행해도 중복 적재/데이터 폭발이 발생하지 않도록 `logic_key` 기반 upsert를 보장한다.
  - **검증**: 적재 후 레코드 수/필수 logic_key 존재 여부를 검사하고 실패 시 비정상 종료(exit 1)
  - **대량 적재**: 1회 적재량이 커도 타임아웃/메모리 폭발 없이 배치 처리(Chunking)

### 7.1 DB 백업 정책(필수)

- Supabase/Postgres:
  - 자동 백업 주기 확인 + 복구 절차 문서화
- 최소 요구:
  - “실수로 삭제/마이그레이션 사고” 시 복구 가능해야 함

### 7.2 마이그레이션 원칙(필수)

- production에서 수동 SQL 실행 금지(원칙)
- migrations 파일로만 배포
- 롤백 전략(최소):
  - 이전 마이그레이션 스냅샷/태그 유지

---

## 8) Performance & Cost Control — 필수

### 8.1 캐시/요약/예산 규칙 집행(필수)

- 캐시 hit면 LLM 호출 0회
- 컨텍스트 예산 초과 시:
  - 원문 더 붙이지 않고 요약 대체
- 요약 실패 3회 연속:
  - text_only 모드 강제 + structured 요약은 프롬프트에서 제거(Null/'')

### 8.2 이미지/정적 자산 최적화(권장)

- OG 이미지/아이콘/폰트 용량 확인
- (권장) next/image 사용

---

## 9) Accessibility & UX 안정성 — 권장(하지만 현실적으로 중요)

- 기본 키보드 접근 가능
- 폼 에러 메시지 명확(특히 생년월일/시간모름)
- 네트워크 오류 시 재시도 UX 제공

---

## 10) Analytics / KPI — 권장(운영 필수)

- GA4 또는 PostHog(선택)
- 최소 이벤트:
  - 만세력 계산 성공
  - 회원가입
  - 리포트 결제 진입/완료
  - 리포트 생성 성공
  - 상담 시작/차감 발생
- 개인정보 포함 이벤트 금지(차트 input 값 그대로 보내지 말 것)

---

## 11) Release & Environment — 필수

### 11.1 환경변수 체크(필수)

- `.env.example` 제공
- 누락 시 서버 부팅/빌드 실패하도록 체크(권장)

### 11.2 Staging 환경(권장)

- PG/결제는 테스트 모드 분리
- Sentry도 staging 분리

---

## 12) “배포 가능” 최종 체크리스트(결론)

- [ ] `/terms`, `/privacy` 존재 + Footer 링크 노출
- [ ] Global metadata + `public/og-default.png` 존재
- [ ] Sentry client/server 연동 + 민감정보 마스킹
- [ ] support mailto 노출
- [ ] Rate limit 적용(핵심 API)
- [ ] Idempotency 제약(DB unique) 적용
- [ ] DB 백업/복구 절차 문서화
- [ ] 운영 로그(request_id) 표준 적용
- [ ] n8n 캐시/요약/비상모드 규칙 집행 확인
- [ ] `npm run seed` 제공 + seed 멱등/검증 포함
- [ ] `.env.example` 제공(모든 키 명시, 값은 비움)

# 부록: 최종 DB 스키마 매핑(Source of Truth)

- 버전: v1.1
- 최종 업데이트: 2025-12-21 (Asia/Seoul)
- 상태: FINAL

# 📂 [Final] Saju Service DB Schema Mapping (Source of Truth) — v1.1 (QA Patch)

- 작성일: 2025-12-21
- 목적: PRD1/2/3 + 기능명세서의 요구사항을 **DB 스키마/제약/인덱스 수준에서 강제**하기 위한 최종 매핑 문서
- 원칙: 이 문서와 충돌하는 구현은 버그로 간주한다.

---

## 0. 먼저 결론(너 문서의 수정/보강 포인트)

너가 작성한 방향(결제=권한=차트 1개 바인딩, Ledger)은 맞다.  
다만 아래 5개가 빠지면 실제 운영에서 터진다(고객센터 폭주 레벨):

1. **`chat_messages` 테이블이 없음** → 멱등 저장/차감 원자화가 구현 불가
2. **Entitlement↔Chart 1:1 강제 제약이 없음** → 하나의 차트를 여러 결제가 잡는 사고
3. **Credit Ledger 중복 차감 방지 유니크가 없음** → 재시도/타임아웃 시 -2, -3 차감
4. **리포트 스냅샷/재생성(Revision) 필드가 없음** → “업서트로 덮어쓰기” 사고 재발
5. **삭제 방지(LOCK A) DB 레벨 강제가 약함** → locked 차트 삭제 시도에서 깨진 상태 가능

이 v1.1에서 위 5개를 “DB에서 못하게” 보강했다.

---

## 1. 핵심 정책 요약(강제)

1. **1 Payment = 1 Entitlement**
2. **Entitlement ↔ Chart (1:1 바인딩)**
3. **Ledger System**: 상담 크레딧 충전/차감은 반드시 `credit_logs`에 기록
4. **Lock A**: 유료 리포트에 사용된(locked) 차트는 삭제 불가(숨김만)
5. **Lock B**: 리포트 생성은 멱등이며, Bound 상태에서 실패해도 “무료 복구” 가능
6. **Chat Gate**: 상담은 리포트(사주풀이) 이후에만 가능
7. **Deduct Rule**: assistant 메시지 저장 성공 1회 = 1차감(저장 실패는 0차감)

---

## 2. 테이블 상세 매핑

### ① `saju_charts` (만세력/차트 데이터)

> 역할: 만세력 계산 결과 저장소 (**회원 저장 O / 게스트 DB 저장 X**)

**컬럼**

- `id` (UUID, PK)
- `owner_id` (UUID, NOT NULL) — **게스트 저장 X 정책이므로 NOT NULL이 안전**
- `input_json` (JSONB, NOT NULL)
- `result_json` (JSONB, NOT NULL) — 시간모름이면 시주 관련 필드는 null/unknown 유지
- `is_locked` (Boolean, NOT NULL, Default false) — 유료 리포트 바인딩 시 true
- `name` (Text, NULL) — 사용자가 붙인 이름 (예: “우리 남편”)
- `is_hidden` (Boolean, NOT NULL, Default false) — **삭제 대신 숨김**
- `created_at`, `updated_at` (Timestamptz)

**제약/인덱스(필수)**

- (권장) `UNIQUE (owner_id, name)` — 이름 중복 방지(선택)
- `INDEX (owner_id, created_at DESC)`
- `INDEX (owner_id, is_hidden, created_at DESC)`

**삭제 정책(강제)**

- 프론트에서 “삭제” 버튼은 locked 차트에 노출 금지
- 서버는 삭제 요청 시:
  - `is_locked=true`면 403/409로 거절 + 고정 메시지 “삭제 불가: 숨김 처리만 가능합니다.”
- DB에서도 `interpretation_reports.chart_id` FK가 `RESTRICT`라 실삭제가 막힌다(아래 참고)

---

### ② `entitlements` (구매 권한/이용권)

> 역할: “무엇을 할 수 있는가”를 정의하는 티켓(결제 1건=1개)

**컬럼**

- `id` (UUID, PK)
- `owner_id` (UUID, NOT NULL)
- `product_type` (Text, NOT NULL)
  - `interpretation_only` | `interpretation_chat_pack` | `chat_addon`(추가상담)
- `status` (Text, NOT NULL)
  - `unbound` | `bound` | `refunded`(선택) | `canceled`(선택)
- `bound_chart_id` (UUID, NULL, FK -> `saju_charts.id`)
- `linked_payment_id` (Text, NOT NULL) — 주문번호/결제 트랜잭션 추적
- `parent_entitlement_id` (UUID, NULL, FK -> entitlements.id) — **chat_addon이 어떤 base entitlement에 붙는지**
- `created_at` (Timestamptz)

**제약/인덱스(필수)**

- **Entitlement↔Chart 1:1 강제**
  - `UNIQUE (bound_chart_id) WHERE bound_chart_id IS NOT NULL`
  - 의미: 한 차트는 단 하나의 entitlement에만 바인딩 가능(정책 2 강제)
- `INDEX (owner_id, created_at DESC)`
- `INDEX (linked_payment_id)`

**비고**

- “패키지(리포트+상담)”는 entitlement 1개로 충분하다.
- “추가 상담”은 `chat_addon` entitlement를 만들고 `parent_entitlement_id`로 base에 묶는다.

---

### ③ `interpretation_reports` (사주풀이 결과)

> 역할: 확정된 entitlement로 생성된 리포트 **스냅샷(불변)**

**컬럼**

- `id` (UUID, PK)
- `entitlement_id` (UUID, NOT NULL, FK -> `entitlements.id`)
- `chart_id` (UUID, NOT NULL, FK -> `saju_charts.id`)
- `payload_json` (JSONB, NOT NULL) — **스냅샷**
- `tier` (Text, NOT NULL) — `basic` | `premium`
- `report_revision` (Int, NOT NULL, Default 1) — 재생성 시 +1
- `engine_version` (Text, NOT NULL) — 알고리즘 버전 기록(예: “interp-v3.2”)
- `is_current` (Boolean, NOT NULL, Default true) — 최신 리비전 표시
- `created_at` (Timestamptz)

**FK 옵션(LOCK A 핵심)**

- `chart_id` FK는 반드시 **ON DELETE RESTRICT** (CASCADE 금지)

**제약/인덱스(필수)**

- `UNIQUE (entitlement_id, report_revision)`
- `INDEX (chart_id)`
- `INDEX (entitlement_id, is_current)`

**스냅샷 불변성(강제)**

- 기본 조회는 `is_current=true` 리포트 반환
- 자동 업서트로 덮어쓰기 금지
- 재생성은 “새 row 생성 + 이전 is_current=false”로 처리

---

### ④ `chat_sessions` (상담 채팅방)

> 역할: 상담 대화의 컨텍스트 단위  
> **중요:** 상담은 반드시 “리포트 기반”이어야 한다.

**컬럼**

- `id` (UUID, PK)
- `owner_id` (UUID, NOT NULL)
- `entitlement_id` (UUID, NOT NULL, FK -> entitlements.id)
- `report_id` (UUID, NOT NULL, FK -> interpretation_reports.id) — **상담 anchor를 명시**
- `summary_mode` (Text, NOT NULL) — `structured` | `text_only`
- `session_summary_structured` (JSONB, NULL)
- `session_summary_text` (Text, NULL)
- `summary_fail_streak` (Int, NOT NULL, Default 0)
- `created_at`, `updated_at` (Timestamptz)

**인덱스(필수)**

- `INDEX (owner_id, updated_at DESC)`
- `INDEX (report_id)`

---

### ⑤ `chat_messages` (상담 메시지)

> 역할: 멱등 저장/차감 원자화를 위한 **source of truth**

**컬럼**

- `id` (UUID, PK)
- `session_id` (UUID, NOT NULL, FK -> chat_sessions.id)
- `owner_id` (UUID, NOT NULL)
- `role` (Text, NOT NULL) — `user` | `assistant` | `system`
- `content` (Text, NOT NULL)
- `idempotency_key` (Text, NOT NULL) — 클라이언트/게이트웨이가 생성
- `created_at` (Timestamptz)

**제약(필수)**

- **유니크:** `UNIQUE (owner_id, idempotency_key)`

**인덱스**

- `INDEX (session_id, created_at ASC)`

---

### ⑥ `credit_logs` (상담 크레딧 장부 - Ledger) ★ 중요

> 역할: 크레딧의 모든 충전/사용 이력

**컬럼**

- `id` (UUID, PK)
- `owner_id` (UUID, NOT NULL)
- `entitlement_id` (UUID, NOT NULL, FK -> entitlements.id)
- `amount` (Int, NOT NULL) — +충전 / -차감
- `reason` (Text, NOT NULL)
  - `initial_pack` | `chat_deduct` | `addon_purchase` | `admin_adjust`(선택)
- `related_ref_id` (Text, NOT NULL)
  - 결제 ID 또는 `chat_messages.id`(assistant message id 권장)
- `created_at` (Timestamptz)

**중복 차감 방지(필수)**

- `UNIQUE (entitlement_id, reason, related_ref_id)`

**잔액 조회(규격)**

- Source of truth:
  - `SELECT COALESCE(SUM(amount),0) FROM credit_logs WHERE entitlement_id=?`
- 성능 최적화(선택):
  - `entitlements.cached_balance` + 트리거/정기 리빌드
  - 단, cached_balance는 “캐시”일 뿐이며 분쟁 시 credit_logs 합이 진실

---

## 3. “권한 확정 처리”를 DB 관점에서 못 박기(필수)

권한 확정 = **entitlements.bound_chart_id 기록 + saju_charts.is_locked=true**를 한 트랜잭션으로 처리.

- 권장 RPC(개념):
  - `confirm_entitlement_and_lock_chart(entitlement_id, chart_id, idempotency_key)`
- 규칙:
  - 이미 bound인데 같은 chart면 OK(멱등)
  - 이미 bound인데 다른 chart면 409(불일치)

---

## 4. Lock B(리포트 생성 멱등) — DB가 도와줘야 하는 부분

- bound + current report 존재 → 기존 반환
- bound + report 없음 → 무료 생성 재시도
- unbound → (bound+lock+create) 원자 트랜잭션

권장:

- `interpretation_reports` revision 모델 채택(업서트 금지)

---

## 5. 최소 권장 추가 테이블(선택)

- `orders`/`payments` (환불/상태 동기화가 필요하면 필수로 승격)
- `entitlement_events`(감사 로그)

---

## 6. 개발자 체크리스트(필수)

- [ ] `chat_messages` 존재 + `UNIQUE(owner_id, idempotency_key)`
- [ ] `credit_logs` `UNIQUE(entitlement_id, reason, related_ref_id)`
- [ ] `entitlements` `UNIQUE(bound_chart_id) WHERE NOT NULL`
- [ ] `interpretation_reports.chart_id` FK: **ON DELETE RESTRICT**
- [ ] 리포트는 upsert 금지, revision row 생성
- [ ] locked 차트 삭제 금지, 숨김만

# 부록: Seed Data ETL 매핑 규격

- 버전: v1.1.1 (Patch: 4-sheet import)
- 최종 업데이트: 2025-12-26

# 📂 [Final] Seed Data ETL Mapping Specification (v1.1.1)

## 0) 결론(중요)

- **원문 데이터(@_.csv/@_.txt)에서 스크립트를 “추출”하는 단계는 이번 범위가 아닙니다.**
- seed/동기화의 입력은 **프로젝트 `data/` 폴더의 4개 CSV(=4개 시트)**로 고정합니다.
- 이 4개 CSV는 이미 “정제 완료된 DB 시트”이므로, **그대로 DB에 멱등 UPSERT** 하면 끝입니다.

### 입력(고정)

- `data/conversation.csv`
- `data/interpretation.csv`
- `data/persona.csv`
- `data/solution.csv`

### 출력(고정)

- `public.conversation_script`
- `public.interpretation_base`
- `public.persona_vibe_hook`
- `public.solution_action`

### 금지(강제)

- CSV 헤더/컬럼/순서 변경
- `id` / `logic_key` 변경
- 원문(@파일)에서 재추출해서 덮어쓰기

---

## 1) CSV ↔ 테이블 매핑(고정)

### 1.1 `data/conversation.csv` → `public.conversation_script`

- **필수 컬럼(NOT NULL 기준)**: `id`, `logic_key`, `domain`, `title`, `content_sections`
- 권장 컬럼: `subdomain`, `layer`, `variant_type`, `free_sections`, `free_preview`, `timing_signals`, `timing_window_hint`,
  `requires_disclaimer`, `disclaimer_type`, `safety_tags`, `access_tier`, `is_active`, `version`, `lang`, `source_ref`

### 1.2 `data/interpretation.csv` → `public.interpretation_base`

- **필수 컬럼(NOT NULL 기준)**: `id`, `logic_key`, `domain`, `title`, `content_sections`
- 권장 컬럼: `subdomain`, `layer`, `one_line_summary`, `free_sections`, `free_preview`, `tone`, `trust_level`, `priority`,
  `lang`, `is_active`, `version`, `source_ref`, `timing_signals`, `timing_window_hint`,
  `requires_disclaimer`, `disclaimer_type`, `safety_tags`, `access_tier`

### 1.3 `data/persona.csv` → `public.persona_vibe_hook`

- **필수 컬럼(NOT NULL 기준)**: `id`, `persona_id`, `use_case`, `text`
- 권장 컬럼: `logic_key`, `variant_type`, `tone_note`, `priority`, `lang`, `is_active`, `version`,
  `source_name`, `source_ref`, `access_tier`, `is_marketing_free`, `safety_tags`

### 1.4 `data/solution.csv` → `public.solution_action`

- **필수 컬럼(NOT NULL 기준)**: `id`, `logic_key`, `domain`, `type`, `title`, `content_detail`
- 권장 컬럼: `subdomain`, `severity`, `title_display`, `content_sections`, `free_sections`, `risk_preview`, `product_hint`,
  `source_ref`, `timing_signals`, `timing_window_hint`,
  `requires_disclaimer`, `disclaimer_type`, `safety_tags`, `access_tier`, `is_active`

---

## 2) 타입 파싱 규칙(엄격)

### 2.1 JSONB 컬럼

- `content_sections`, `product_hint`는 **유효한 JSON 문자열**이어야 합니다.
- 빈 값이면:
  - `content_sections`는 **허용 안 함(필수인 테이블이 있음)** → 해당 row는 오류로 처리
  - `product_hint`는 `null` 허용

### 2.2 TEXT[] 컬럼

- `free_sections`, `timing_signals`, `safety_tags` 등은 아래 2가지 입력을 모두 허용하도록 파서를 짭니다:
  1. JSON 배열 문자열: `["a","b"]`
  2. Postgres 배열 문자열: `{a,b}`
- 빈 값은 `[]`로 처리

### 2.3 boolean / number

- boolean: `TRUE/FALSE`, `true/false`, `1/0` 모두 허용
- number: `int/float` 캐스팅 실패 시 오류(해당 row 스킵 금지, 바로 실패 권장)

---

## 3) 멱등(Upsert) 규칙(필수)

- 기준 키: **테이블의 PK인 `id`**
- 방식:
  - `INSERT ... ON CONFLICT (id) DO UPDATE ...`
  - 같은 seed를 여러 번 돌려도 row 수가 늘면 실패

---

## 4) 검증(필수)

파일별로 아래를 통과해야 합니다:

- 파싱 성공(0건이면 실패)
- 필수 컬럼 누락/빈값 0건
- JSON 파싱 실패 0건
- 업서트 완료 후 `SELECT count(*)`로 최소 row 수 확인(0이면 실패)

---

## 5) 개발자에게 전달할 “최종 지시 문구”(복붙)

> `data/` 폴더의 4개 CSV( conversation / interpretation / persona / solution )를 각각의 테이블에 멱등 업서트로 seed 적재하세요.  
> 원문(@_.csv/@_.txt)에서 스크립트를 다시 추출하는 로직은 이번 범위가 아닙니다.  
> 실행 커맨드는 `npm run seed`로 고정하고, JSONB/ARRAY/boolean/number 파싱을 엄격히 하며, 검증 실패 시 exit 1로 종료하세요.
