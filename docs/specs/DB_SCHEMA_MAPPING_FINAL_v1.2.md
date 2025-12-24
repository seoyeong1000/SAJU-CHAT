# 📂 [Final] Saju Service DB Schema Mapping (Source of Truth) — v1.2 (QA Patch)
- 작성일: 2025-12-21
- 목적: PRD1/2/3 + 기능명세서의 요구사항을 **DB 스키마/제약/인덱스 수준에서 강제**하기 위한 최종 매핑 문서
- 원칙: 이 문서와 충돌하는 구현은 버그로 간주한다.

---

## 0. 먼저 결론(너 문서의 수정/보강 포인트)
너가 작성한 방향(결제=권한=차트 1개 바인딩, Ledger)은 맞다.  
다만 아래 5개가 빠지면 실제 운영에서 터진다(고객센터 폭주 레벨):

1) **`chat_messages` 테이블이 없음** → 멱등 저장/차감 원자화가 구현 불가  
2) **Entitlement↔Chart 1:1 강제 제약이 없음** → 하나의 차트를 여러 결제가 잡는 사고  
3) **Credit Ledger 중복 차감 방지 유니크가 없음** → 재시도/타임아웃 시 -2, -3 차감  
4) **리포트 스냅샷/재생성(Revision) 필드가 없음** → “업서트로 덮어쓰기” 사고 재발  
5) **삭제 방지(LOCK A) DB 레벨 강제가 약함** → locked 차트 삭제 시도에서 깨진 상태 가능

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
8. **Seed Data Required:** 서비스 구동에 필요한 필수 텍스트(해석/페르소나/룰)는 `saju_contents`에 적재되어 있어야 한다. (없으면 리포트/챗봇이 백지)

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

### ⑦ `saju_contents` (Seed Data / 해석 텍스트 라이브러리)
> **역할:** 만세력/사주풀이/챗봇 페르소나 등 “필수 텍스트 데이터” 저장소  
> ※ `npm run seed`가 적재하는 대상

- `id` (UUID, PK)
- `category` (TEXT, NOT NULL) — 예: `10_gods`, `element`, `system_prompt`, `rag_source`
- `logic_key` (TEXT, NOT NULL) — 예: `wood_strong`, `default_persona`
- `content_template` (TEXT, NOT NULL) — 실제 텍스트(마크다운 허용)
- `source_file` (TEXT, NULL) — 출처 파일명(디버깅용)
- `metadata` (JSONB, NULL) — 태그/가중치/추가정보
- `created_at`, `updated_at` (TIMESTAMPTZ)

**[제약]**
- `(category, logic_key) UNIQUE` — Seed 멱등성(Upsert 기준)

**[가이드]**
- Seed 스크립트는 `INSERT ... ON CONFLICT (category, logic_key) DO UPDATE` 형태로만 적재한다.
- `content_template`가 비어있거나 너무 짧으면(예: 10자 미만) Skip + 로그를 남긴다.

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




