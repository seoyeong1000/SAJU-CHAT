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
- 원본 데이터:
  - 제공된 CSV/TXT 파일(예: `@삼송사주_통합_정리본.csv`, `@1_8_통합자료.txt` 등)을 파싱하여 DB에 INSERT/UPSERT
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