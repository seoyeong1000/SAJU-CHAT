# PRD2 FINAL — 사주풀이(유료 리포트) 서비스

- 버전: v2.1
- 최종 업데이트: 2025-12-21 (Asia/Seoul)
- 상태: FINAL

## 이번 통합 업그레이드에서 “패치로만 있던 내용”을 본문에 흡수한 항목
- 공통(NFR): Legal/SEO/OG/Sentry/Support + 보안/레이트리밋/멱등/로그/백업/마이그레이션/비용통제
- DB Source of Truth: entitlement-차트 바인딩 1:1, 리포트 스냅샷 불변, 차트 삭제 금지(Lock A), 생성 멱등/복구(Lock B), 채팅 차감 원자화 RPC, 장부(credit_logs) 유니크
- Seed/ETL: `npm run seed` + 파일별 매핑 규격 + 멱등/검증/청크 처리
- 환경변수: `.env.example` 강제

## 공통 필수 요구사항(이 PRD에 반드시 적용)
> 아래 규칙은 “기능”이 아니라 “서비스가 운영 가능한지”를 결정하는 **강제 스펙**입니다.

1) **클라이언트 → n8n 직결 금지**: 모든 호출은 Next.js Gateway를 통해서만 수행  
2) **유료 필터링/권한 판정은 서버가 진실**: 프론트에서 숨김으로 때우지 않음  
3) **멱등성/원자성**: 결제/리포트 생성/상담 차감은 중복 실행돼도 1번만 처리  
4) **관측 가능성**: request_id + Sentry + 운영 로그 표준  
5) **Seed/환경변수**: 빈 DB에 데이터/키 넣는 절차가 없으면 배포 불가

- 상세 규격은 문서 하단 부록(NFR/DB/Seed)을 그대로 따른다.

---

**문서 정보**
* **프로젝트:** Saju Life Solution - Analysis & Interpretation Core
* **버전:** v2.4 (Logic Key 체계 문서화 추가)
* **목표:** Phase 1(만세력) 결과를 분석하여 로직 키를 추출하고, DB를 조회하여 사용자 리포트를 생성한다.

---

## 1. 시스템 아키텍처

### 1.1 모듈 1: 분석 엔진 (Analysis Engine)
* **Endpoint:** `POST /api/analysis/run`
* **Access:** **Internal Only** (클라이언트 호출 금지, 서버 내부 또는 n8n 전용).
* **Input:** `bazi_result` (만세력 결과 JSON) 또는 `chart_id`.
* **Process:**
    1.  **Idempotency (멱등성):** `chart_id`에 대한 분석 결과가 이미 존재하고, `ruleset_version`이 최신과 같다면 기존 결과 반환.
    2.  **Calculation:** `master_logic_definitions` 테이블의 `calc_params`를 기준으로 오행/십성/신살 등을 계산.
    3.  **Output:** `logic_keys` 리스트와 `summary` 데이터를 DB `chart_analysis_results` 테이블에 **Upsert** 저장.
* **Config:** `ruleset_version` (예: "v7_2025_q1")은 환경변수나 상수 파일에서 관리.

### 1.2 모듈 2: 리포트 엔진 (Interpretation Engine)
* **Endpoint:** `POST /api/interpretation/report`
* **Access:** Public (User Authenticated).
* **Input:** `chart_id`, `topic` (default: "all"), `depth` (default: "full"), `lang` (default: "ko").
* **Security:** **반드시 `chart_id`의 소유권(`owner_id`)이 현재 로그인한 유저(`auth.uid()`)와 일치하는지 검증할 것.**
* **Process:**
    1.  분석된 `logic_key`를 기반으로 `master_interpretations`, `master_solutions` 테이블 조회.
    2.  **Filtering:** `is_active=true`, `lang` 일치, `domain` 일치 여부 확인.
    3.  **Fallback Policy:** 특정 도메인에 데이터가 하나도 없을 경우, `logic_key = "generic.general.fallback"` 데이터를 조회하여 반환 (빈 화면 방지).
    4.  **Caching:** `(chart_id, topic, depth, lang)` 조합으로 캐싱 고려.

---

## 2. 데이터베이스 스키마 (참조)
* **Tables:** `master_logic_definitions`, `master_interpretations`, `master_solutions`.
* **Key constraint:** `logic_key`는 불변 식별자이며, 버전 관리는 `version` 필드와 `is_active` 플래그로 한다.

---

## 3. Logic Key 체계 및 단계별 지원 범위

### 3.1 Logic Key 명명 규칙
```
{category}.{subcategory}.{specific_key}

예시:
- ganji.daily.jia_zi         (60갑자 일주: 갑자)
- elem.strength.wood.excess  (오행 강약: 목 과다)
- ten_god.strength.bijian.normal (십성 강약: 비견 정상)
- spirit.cheoneur.present_blessed (신살: 천을귀인 길신)
```

### 3.2 Phase 1 지원 범위 (MVP - 현재)
**즉시 구현 가능:**
- ✅ `ganji.daily.*` (60갑자 일주) - 120개 데이터
- ✅ `elem.struct.*` (오행 구조) - 10개 데이터
- ✅ `ten_god.struct.*` (십성 구조) - 20개 데이터
- ✅ Fallback 처리 (`generic.general.fallback`)

**Interpretation 조회 예시:**
```sql
SELECT * FROM master_interpretations
WHERE logic_key = 'ganji.daily.jia_zi'
  AND domain = 'general'
  AND is_active = true
  AND lang = 'ko';
```

### 3.3 Phase 2 지원 범위 (Week 1~4)
**1개월 내 추가 예정:**
- 🔄 `elem.strength.*.medium` (오행 중화) - Week 1
- 🔄 `elem.strength.*.excess` (오행 과다) - Week 2
- 🔄 `elem.strength.*.deficiency` (오행 허약) - Week 2
- 🔄 `ganji.daily.*.money` (60갑자 재물운) - Week 3
- 🔄 `ganji.daily.*.love` (60갑자 연애운) - Week 4

**총 추가 예상:** +363개 데이터

### 3.4 Phase 3 지원 범위 (Week 5~8)
**2개월 내 추가 예정:**
- 🔄 `ten_god.strength.*.normal` (십성 정상) - Week 5
- 🔄 `ganji.daily.*.career` (60갑자 직업운) - Week 6
- 🔄 `ganji.daily.*.health` (60갑자 건강운) - Week 7
- 🔄 `spirit.cheoneur.*` (천을귀인 신살) - Week 8
- 🔄 `spirit.yeokma.*` (역마 신살) - Week 8
- 🔄 `spirit.dohwa.*` (도화 신살) - Week 8

**총 추가 예상:** +520개 데이터

### 3.5 Phase 4 지원 범위 (Week 9~12, 선택)
**3개월 내 추가 가능 (전문가 검수 필수):**
- ⚠️ `pattern.jeonggwan.*` (정관격 등 격국)
- ⚠️ `use_god.*` (용신 체계)
- ⚠️ `ten_god.position.*` (십성 위치별)
- ⚠️ `fortune.daeun.*` (대운)

---

## 4. Fallback 정책 상세

### 4.1 Fallback 우선순위
1. **1순위:** 정확한 `logic_key` + `domain` 매칭
   ```sql
   logic_key = 'ganji.daily.jia_zi' AND domain = 'love'
   ```

2. **2순위:** 정확한 `logic_key` + `domain='general'`
   ```sql
   logic_key = 'ganji.daily.jia_zi' AND domain = 'general'
   ```

3. **3순위:** Generic fallback
   ```sql
   logic_key = 'generic.general.fallback'
   ```

4. **4순위:** 빈 배열 반환
   ```json
   {
     "interpretations": [],
     "message": "해당 도메인의 데이터를 준비 중입니다."
   }
   ```

### 4.2 Fallback 구현 예시
```javascript
// 1순위 시도
let results = await queryDB({ logic_key, domain });

// 2순위 시도
if (results.length === 0 && domain !== 'general') {
  results = await queryDB({ logic_key, domain: 'general' });
}

// 3순위 시도
if (results.length === 0) {
  results = await queryDB({ 
    logic_key: 'generic.general.fallback',
    domain: 'general' 
  });
}

// 4순위: 빈 응답
return results.length > 0 ? results : {
  interpretations: [],
  message: "해당 도메인의 데이터를 준비 중입니다."
};
```

---

## 5. 구현 가이드

### 5.1 MVP (지금 당장)
**구현 항목:**
- Analysis Engine: 60갑자 일주 logic_key 추출
- Interpretation Engine: DB 조회 + Fallback 처리
- 현재 160개 데이터로 테스트

**테스트 시나리오:**
```javascript
// 갑자일주 general 도메인
POST /api/analysis/run
{ "chart_id": "uuid", "bazi_result": { "day_pillar": "甲子" } }

→ logic_keys: ["ganji.daily.jia_zi"]

POST /api/interpretation/report
{ "chart_id": "uuid", "topic": "general" }

→ "갑자일주는 큰 물에 새싹이 돋는 형상..." (120개 데이터 중 조회)
```

### 5.2 Week 1~2 (권장 런칭 시점)
**추가 구현:**
- 오행 강약 logic_key 추출 (elem.strength.*)
- 오행 통변 75개 데이터 추가
- 도메인별 조회 테스트 (general/money/love)

### 5.3 Week 4 (이상적 런칭 시점)
**추가 구현:**
- 60갑자 4개 도메인 완성 (240개)
- SOLUTION 테이블 연동
- 페르소나 vibe 연동

---

## 6. 성능 및 최적화

### 6.1 캐싱 전략
```javascript
// Redis 또는 메모리 캐싱
const cacheKey = `interp:${chart_id}:${topic}:${depth}:${lang}`;
const cached = await cache.get(cacheKey);

if (cached) return cached;

// DB 조회 후 캐싱 (TTL: 1시간)
const result = await queryDB(...);
await cache.set(cacheKey, result, 3600);
```

### 6.2 DB 인덱스
```sql
-- 필수 인덱스
CREATE INDEX idx_logic_key_domain 
ON master_interpretations(logic_key, domain, is_active, lang);

CREATE INDEX idx_chart_analysis 
ON chart_analysis_results(chart_id, ruleset_version);
```

---

## 7. 에러 처리

### 7.1 에러 시나리오
1. **chart_id 소유권 없음**
   ```json
   { "error": "FORBIDDEN", "message": "접근 권한이 없습니다." }
   ```

2. **logic_key 데이터 없음**
   → Fallback 정책 적용 (빈 화면 방지)

3. **DB 연결 오류**
   ```json
   { "error": "DB_ERROR", "message": "잠시 후 다시 시도해주세요." }
   ```

### 7.2 로깅
```javascript
// 모든 API 호출 로깅
logger.info({
  endpoint: '/api/interpretation/report',
  chart_id,
  logic_keys,
  domain,
  results_count,
  duration_ms
});
```

---

## 8. 버전 관리

### 8.1 Ruleset Version
```javascript
// 환경변수 또는 config 파일
const RULESET_VERSION = "v7_2025_q1";

// DB 저장 시
await db.insert('chart_analysis_results', {
  chart_id,
  ruleset_version: RULESET_VERSION,
  logic_keys,
  analyzed_at: new Date()
});
```

### 8.2 데이터 버전 관리
- `master_interpretations` 테이블의 `version` 필드 활용
- 같은 `logic_key`에 여러 버전 공존 가능
- `is_active=true`인 최신 버전만 조회

---

**수정 이력:**
- v2.3 → v2.4: Logic Key 체계 및 단계별 지원 범위 문서화 추가 (2024-12-12)
---

# ✅ [감리 반영] Phase2 “Lock A + Lock B” 강제 스펙 (Patch v1.1)

- 반영일: 2025-12-21
- 목적: Phase2(유료 사주풀이 리포트)를 **DB 제약 + API 멱등성 + 트랜잭션**으로 “철옹성”으로 만든다.
- 적용 우선순위: 기존 본문과 충돌 시 **본 패치 섹션 우선**

---

## Lock A — 삭제 방지 수갑 (DB 무결성 강제)

### A1. FK 제약(강제)
- `interpretation_reports.chart_id` 는 `saju_charts.id` 를 참조한다.
- FK 옵션은 반드시 다음으로 고정한다:
  - `ON DELETE RESTRICT`
  - `ON UPDATE RESTRICT`(또는 NO ACTION)
- **CASCADE 금지**

> 이유: 유료 리포트는 결제 상품이며, 연결된 원천 데이터(chart)가 삭제되어 리포트가 파손되면 안 된다.

### A2. 삭제 정책(강제)
- `saju_charts.is_locked = true` 인 차트는 **절대 삭제 불가**
- 사용자가 “정리”를 원하면 삭제 대신:
  - `is_hidden = true`(또는 `hidden_at`)로 숨김 처리만 허용

### A3. 에러/UX 규격(강제)
- 삭제 시도 시(locked 또는 FK restrict 위반):
  - 서버는 HTTP **403** 또는 **409** 중 하나로 통일(추천: 403)
  - 메시지(고정): `삭제 불가: 숨김 처리만 가능합니다.`
- 프론트는 동일 문구를 노출하고, 삭제 UI를 “숨김”으로 대체한다.

### A4. 구현 기준(DB 레벨 필수)
- 아래 2개 중 최소 1개를 **DB 레벨**로 반드시 구현:
  1) FK `ON DELETE RESTRICT`
  2) `BEFORE DELETE` 트리거로 `is_locked=true` 차트 삭제 차단

---

## Lock B — 스마트 자판기 (생성 안전장치 + 멱등 API)

### B1. 원칙(강제)
`/api/interpretation/report`(리포트 생성 요청)는 **멱등성(Idempotency)** 을 보장해야 한다.

- 사용자가 1번 눌러도 100번 눌러도:
  - **돈(권한 차감)은 한 번만**
  - 리포트는 결국 **정상 제공**

### B2. 상태 정의(강제)
- `Unbound`: entitlement는 존재하지만 `bound_chart_id`가 없음
- `Bound`: entitlement에 `bound_chart_id`가 존재
- `ReportExists`: entitlement에 연결된 report row가 존재

### B3. API 동작(강제 로직)
#### Request
- `POST /api/interpretation/report`
  - body: `entitlement_id`, `chart_id`(Unbound일 때만 필요)

#### Response
- 200 OK (성공/재호출 포함)
  - `report_id`
  - `status`: `ready`
  - `is_idempotent_return`: boolean (true면 기존 리포트 반환)
- 409/422 (입력 불일치: bound chart와 다른 chart로 생성 시도 등)

#### 로직 (순서 고정)
1) entitlement 조회(owner 검증 포함)
2) 분기:

**(1) 이미 Bound && ReportExists**
- → 에러 없이 **기존 리포트 반환**
- → 차감/결제 로직 절대 실행 금지

**(2) 이미 Bound && ReportMissing**
- → 차감 없이 **리포트 생성만 재시도**
- → 생성은 반드시 멱등(동시 요청/재시도 안전)

**(3) Unbound**
- → 다음 3가지를 **하나의 트랜잭션**으로 처리:
  1) entitlement를 Bound 처리(`bound_chart_id=chart_id`)
  2) chart 잠금(`saju_charts.is_locked=true`)
  3) report 스냅샷 생성(INSERT)
- → 트랜잭션 실패 시 아무것도 반영되지 않아야 함(부분 성공 금지)

### B4. 구현 방식(강제)
- 권장: 서버에서 아래 RPC 1개로 원자 처리
  - `confirm_and_create_report(entitlement_id, chart_id, idempotency_key)`
- 최소 요구: `create_report_if_missing(entitlement_id)` 멱등 RPC + bound/lock 트랜잭션

### B5. 프론트 대응(강제)
- 리포트 페이지에서 “리포트 없음/생성 실패” 감지 시:
  - 자동 재시도 1회
  - 실패 시 버튼 노출: **[리포트 다시 만들기(무료)]**
- 이 버튼은 횟수 제한 없음
- 버튼 클릭이 결제/차감 루트로 빠지면 **버그로 간주**

---

## 스냅샷 불변성(재확정)
- 유료 리포트는 생성 시점 snapshot을 저장하며 **자동 덮어쓰기(upsert) 금지**
- 재생성은 “새 revision 생성”으로만 허용

---

## QA 필수 시나리오
1) locked 차트 삭제 시도 → 403/409 + 고정 메시지
2) 리포트 생성 API 10회 연속 호출 → report 1개만 생성 + 차감 1회만
3) Bound 직후 서버 다운(ReportMissing) → 다시 호출 시 무료 생성 복구
4) bound chart와 다른 chart_id로 재요청 → 409/422로 차단

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

- 버전: v1.0
- 최종 업데이트: 2025-12-21 (Asia/Seoul)
- 상태: FINAL

# 📂 [Final] Seed Data ETL Mapping Specification (v1.0)
- 목적: 업로드된 Raw Data(CSV/TXT)를 서비스 DB에 **안전하게 적재(Seed)**하기 위한 “파싱/매핑 규격(레시피)”
- 대상: `seed.ts`(또는 `scripts/seed.ts`)를 구현하는 개발자/에이전트
- 핵심 원칙: **고민 없이 이 문서대로만 파싱하면 DB가 엉키지 않게 만든다.**

---

## 0) 초보자 버전 설명 (이사짐 센터 지시서)
- CSV/TXT 파일 = 이삿짐 박스
- DB 테이블 = 새집의 방/가구
- 이 문서 = “박스 A는 거실 책장 1칸, 박스 B는 주방 서랍 3칸” 같은 **정리 규칙**

> 결론: 개발자는 “어디에 무엇을 넣을지” 고민하지 말고, **파싱 코드만** 짜면 됩니다.

---

## 1) Target Schema (Seed 적재용 최소 테이블)
> ⚠️ 지금 Phase에서는 “완벽한 의미 분류”보다 **안전한 적재 + 출처 추적**이 우선입니다.  
> 따라서 1차 적재는 아래 두 테이블로 **원본을 안전하게 보관**하고,  
> 그 다음 단계(2차 ETL/LLM 생성)에서 `INTERPRETATION_BASE` 같은 “정제 DB”를 만듭니다.

### 1.1 `seed_documents` (문서 단위 보관: TXT/CSV 원문 출처)
- 역할: “어느 파일의 어느 문서에서 왔는지” 추적 가능한 원문 보관소

```sql
CREATE TABLE seed_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file TEXT NOT NULL,        -- 예: '@1_8_통합자료.txt'
  source_doc_title TEXT,            -- 예: '1_황제내경.txt' (BEGIN/marker에서 추출)
  source_doc_index INT NOT NULL,    -- 파일 내부 문서 순서(0..)
  raw_text TEXT NOT NULL,           -- 문서 전체 원문(또는 큰 경우 chunk로 쪼개도 됨)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 `saju_contents` (검색/활용 단위: “섹션/청크”)
- 역할: 앱/RAG/리포트 생성이 가져다 쓰기 좋은 단위로 잘라 저장

```sql
CREATE TABLE saju_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,            -- 내부 카테고리(아래 규칙)
  logic_key TEXT NOT NULL,           -- 안정적인 키(아래 규칙)
  title TEXT,                        -- 사용자에게 보일 제목(섹션 타이틀)
  content_template TEXT NOT NULL,    -- 본문(줄바꿈 유지)
  source_file TEXT NOT NULL,         -- 출처 파일명
  source_ref JSONB DEFAULT '{}'::jsonb, -- doc_title, heading_path, index 등
  metadata JSONB DEFAULT '{}'::jsonb,   -- tags, level, date, link 등
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 멱등(중복 방지) 핵심 유니크 키(강제)
CREATE UNIQUE INDEX IF NOT EXISTS uq_saju_contents_key
  ON saju_contents(category, logic_key);
```

> ✅ 왜 2테이블인가?
- `seed_documents`: “원본 통째로” 보관(나중에 오류/출처 추적 가능)
- `saju_contents`: “실제로 쓰기 좋게” 조각낸 조리된 재료

---

## 2) Source Inventory (이번 프로젝트에 실제로 있는 파일 목록)
| 파일 | 타입 | 규모 | 컬럼/특징 |
|---|---:|---:|---|
| `@삼송사주_통합_정리본.csv` | CSV | 472 rows | id, category, title, link, date_iso, content, source_file<br/>top category: {'기초': 331, '중급': 81, '60갑자': 60} |
| `@어바웃사주.csv` | CSV | 31 rows | id, content, source_file<br/> |
| `@해밝_클린_오프닝제거_통합.csv` | CSV | 1,442 rows | id, title, url, date_iso, category, content, source_file<br/>top category: {'해밝의 명리 공부': 1067, '투자 단상(斷想)': 112, '금융, 종목, 산업분석': 60} |
| `@현묘_통합_클린_오프닝제거.csv` | CSV | 1,000 rows | id, source_file, title, detail_title, link, date_iso, content<br/> |
| `@1_8_통합자료.txt` | TXT | 0.09 MB | doc markers: 8 |
| `@고전통합_원문_명리5종+명리정종.txt` | TXT | 0.19 MB | doc markers: 6 |
| `@선운_자료2개_통합원문.txt` | TXT | 0.45 MB | doc markers: 2 |
| `@도화도르_원문_중복제거_통합원본.txt` | TXT | 3.46 MB | markers 없음(규칙/길이 기반 분할 필요) |
| `@명리학 (기타사주 강의 모음).txt` | TXT | 0.62 MB | markers 없음(규칙/길이 기반 분할 필요) |
| `@쵸코서당 초명 유튜브 정리.txt` | TXT | 1.83 MB | markers 없음(규칙/길이 기반 분할 필요) |

---

## 3) 공통 규칙 (모든 파일에 적용되는 기본 규칙)
### 3.1 멱등성(Idempotency) — 무조건
- seed를 10번 실행해도 데이터가 **중복 적재되면 실패**
- 강제 규칙:
  - `saju_contents`: `(category, logic_key)` 유니크 + UPSERT
  - `seed_documents`: `(source_file, source_doc_index)` 유니크(권장)

### 3.2 줄바꿈/따옴표 보존
- `content_template`는 줄바꿈(\n)을 **그대로 유지**
- CSV 내부 따옴표/쉼표가 깨지지 않도록:
  - 파서: `papaparse` 또는 `csv-parse` 권장(혹은 pandas로 사전 점검)

### 3.3 최소 품질 검증(Validation)
- 아래 조건이면 **SKIP + 로그**:
  - content가 비어있음 / 10자 미만
  - id/logic_key가 비어있음
- 적재 후 “필수 레코드 수” 최소치 확인:
  - 예: 총 적재 N개 이상, 파일별 최소 M개 이상

---

## 4) Category/Logic Key 규격 (중요)
### 4.1 category 내부 표준(현실적인 최소 세트)
> Phase 1 seed의 목표는 “정교한 분류”가 아니라 **안전한 분류**입니다.

- `general` : 일반 명리/통변/기초
- `ganji` : 천간/지지/60갑자/일주
- `ten_gods` : 십성/십신
- `five_elements` : 오행(목화토금수)
- `twelve_growth` : 십이운성
- `year_fortune` : 연운/세운(예: 2026년 운세…)
- `investment` : 투자/금융 관련
- `health` : 황제내경/오행 건강
- `rag_source` : 규칙적 매핑이 어려운 “자료창고”(향후 임베딩/RAG용)

### 4.2 logic_key 생성 규칙(우선순위 고정)
- **우선순위 1 (CSV)**: `id` 컬럼이 있으면 **logic_key = id**
- **우선순위 2 (TXT 섹션)**:  
  `logic_key = sha1(source_file + '|' + source_doc_title + '|' + heading_path + '|' + section_index).slice(0,16)`
  - 이유: 제목/띄어쓰기 바뀌어도 키가 안정적이어야 함
- **절대 금지**: title을 그대로 logic_key로 쓰기(변경/중복 위험)

---

## 5) 파일별 매핑 규칙 (Source → Target)

## 5A) Type A: 정형 데이터 (CSV)
### A-1) `@삼송사주_통합_정리본.csv`
- 입력 컬럼: `id, category, title, link, date_iso, content, source_file`
- 적재:
  - `saju_contents.category` = CSV의 `category`를 그대로 저장하되,
    - 내부 표준 category로 바꾸고 싶으면 `metadata.source_category`에 원본 저장 + `category_map` 적용(선택)
  - `logic_key` = `id`
  - `title` = `title`
  - `content_template` = `content`
  - `metadata.link` = `link`, `metadata.date_iso` = `date_iso`

### A-2) `@해밝_클린_오프닝제거_통합.csv`
- 입력 컬럼: `id, title, url, date_iso, category, content, source_file`
- 적재:
  - `logic_key` = `id`
  - `metadata.link` = `url`
  - 나머지는 A-1과 동일

### A-3) `@현묘_통합_클린_오프닝제거.csv`
- 입력 컬럼: `id, source_file, title, detail_title, link, date_iso, content`
- 적재:
  - `logic_key` = `id`
  - `title` = `detail_title`가 있으면 그걸 우선, 없으면 `title`
  - `category`는 컬럼이 없으므로 아래 규칙으로 자동 부여:
    - title에 `년`, `운세`, `202`(연도) 포함 → `year_fortune`
    - 그 외 → `general`

### A-4) `@어바웃사주.csv`
- 입력 컬럼: `id, content, source_file`
- 적재:
  - `logic_key` = `id`
  - `title`은 없으므로 자동 생성:
    - content의 첫 줄이 3~60자면 그걸 title로 사용
    - 아니면 `AboutSaju_<built-in function id>`
  - `category` 기본값: `general`

---

## 5B) Type B: 반정형 텍스트 (TXT) — “문서/섹션 분리”가 핵심
> TXT는 “헤더 기준 분리”가 잘 되면 고급 자료가 되고,  
> 분리가 안 되면 RAG용 창고(`rag_source`)로 넣는 게 안전합니다.

### B-공통 1) 문서(doc) 분리 규칙(우선순위)
1) `===== BEGIN ... =====` 라인이 있으면: 그 라인마다 **새 문서 시작**
   - `source_doc_title` = BEGIN 라인 안의 파일명
2) `BEGIN FILE:` 라인이 있으면: 그 라인마다 **새 문서 시작**
   - `source_doc_title` = 뒤의 파일명
3) 둘 다 없으면: 파일 전체를 **문서 1개**로 취급

### B-공통 2) 섹션(section) 분리 규칙(우선순위)
1) Markdown 헤더: `^#(1, 6)\s+`
2) 로마숫자 헤더: `^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+`
3) 숫자/서브숫자: `^\d+(\.\d+)*\.\s+`
4) 위가 전혀 없으면: **길이 기반 청크**
   - 목표 길이: 800~1,200자
   - 분할 기준: 빈 줄(\n\n) 우선, 없으면 문장 마침표 기준

### B-공통 3) title(섹션 제목) 추출
- 헤더 줄 자체를 title로 사용하되, 꾸밈 제거:
  - `#`, `##`, `###`, `**` 제거
  - 앞의 번호(예: `1.1.`) 제거(선택)
- 헤더가 없고 길이 청크면:
  - 청크 첫 문장 40자 이내를 title로(없으면 `Chunk 0`)

### B-공통 4) category 자동 분류(키워드 기반, 최소 안전 버전)
> 여러 키워드가 동시에 나오면 “우선순위”로 1개만 선택(캐시/검색 꼬임 방지)

우선순위(상위가 이김):
1. `investment` : 투자, 금융, 종목, 매매
2. `health` : 황제내경, 장부, 경락, 건강, 식이, 처방
3. `twelve_growth` : 십이운성
4. `ten_gods` : 십성, 십신
5. `five_elements` : 오행, 목(木), 화(火), 토(土), 금(金), 수(水)
6. `ganji` : 천간, 지지, 60갑자, 일주, 간지
7. `general` : 그 외
8. (분류 자신 없으면) `rag_source`

---

## 5C) Type C: 비정형/대용량 TXT — “RAG 창고”로 안전 적재
적용 후보:
- `@선운_자료2개_통합원문.txt`
- `@도화도르_원문_중복제거_통합원본.txt`
- `@명리학 (기타사주 강의 모음).txt`
- `@쵸코서당 초명 유튜브 정리.txt`

권장 전략:
- 문서/섹션 분리가 70% 이상 성공하면 → `general/ganji/...`로 분류해서 `saju_contents` 적재
- 아니면:
  - `category = rag_source`
  - `metadata.tags`에 파일명 기반 태그만 넣고,
  - 나중에 임베딩 단계에서 사용

---

## 6) seed.ts 구현 요구사항 (개발자가 그대로 따라야 함)
### 6.1 실행 커맨드(고정)
- `npm run seed`

### 6.2 처리 순서(고정)
1) CSV 적재 → `saju_contents` UPSERT
2) TXT 문서 분리 → `seed_documents` INSERT/UPSERT
3) TXT 섹션 분리/청크 → `saju_contents` UPSERT
4) 검증(레코드 수/필수 키 존재) → 실패 시 exit 1

### 6.3 로깅(필수)
- 파일별:
  - 읽은 레코드 수 / 적재 성공 수 / 스킵 수 / 에러 수
- 스킵 사유:
  - empty content / invalid encoding / parse fail 등

---

## 7) 개발자에게 전달할 “최종 지시 문구”(복붙)
> 제공된 CSV/TXT 파일을 DB에 seed로 적재해야 합니다.  
> 이 문서(Seed Data ETL Mapping Spec)의 규칙대로 파싱/매핑하고, `npm run seed`로 실행 가능하게 만들어 주세요.  
> 특히 TXT는 `BEGIN/===== BEGIN` 문서 분리 → 헤더 기준 섹션 분리 → 없으면 길이 기준 청크로 적재하세요.  
> 적재는 반드시 멱등(Upsert)이어야 하고, `(category, logic_key)` 유니크를 지켜야 합니다.

---

## 부록 A) 추천: 코드에 박아둘 규칙 JSON (seed_mapping_rules_v1.json)
- 장점: 개발자가 규칙을 코드에 하드코딩하다가 망가뜨리는 걸 방지

```json
{
  "category_priority": [
    "investment",
    "health",
    "twelve_growth",
    "ten_gods",
    "five_elements",
    "ganji",
    "general",
    "rag_source"
  ],
  "keywords": {
    "investment": [
      "투자",
      "금융",
      "종목",
      "매매",
      "차트",
      "리스크"
    ],
    "health": [
      "황제내경",
      "장부",
      "경락",
      "건강",
      "식이",
      "처방",
      "치료"
    ],
    "twelve_growth": [
      "십이운성",
      "장생",
      "목욕",
      "관대",
      "건록",
      "제왕",
      "쇠",
      "병",
      "사",
      "묘",
      "절",
      "태",
      "양"
    ],
    "ten_gods": [
      "십성",
      "십신",
      "비견",
      "겁재",
      "식신",
      "상관",
      "편재",
      "정재",
      "편관",
      "정관",
      "편인",
      "정인"
    ],
    "five_elements": [
      "오행",
      "목(",
      "화(",
      "토(",
      "금(",
      "수(",
      "목(木)",
      "화(火)",
      "토(土)",
      "금(金)",
      "수(水)"
    ],
    "ganji": [
      "천간",
      "지지",
      "60갑자",
      "육십갑자",
      "일주",
      "간지"
    ]
  },
  "txt_doc_markers": [
    "^===== BEGIN .* =====$",
    "^BEGIN FILE: .*"
  ],
  "txt_heading_patterns": [
    "^#{1,6}\\s+",
    "^(I|II|III|IV|V|VI|VII|VIII|IX|X)\\.\\s+",
    "^\\d+(\\.\\d+)*\\.\\s+"
  ],
  "chunk_target_chars": [
    800,
    1200
  ],
  "logic_key_hash_len": 16
}
```
