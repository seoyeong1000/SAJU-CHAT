# PRD3 FINAL — 사주상담(채팅) 서비스

- 버전: v3.1
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

- **프로젝트:** Saju Life Solution - Persona Chatbot
- **버전:** v2.7 (RAG 단계별 구현 + 페르소나 로직 명확화 + Timeout 전략)
- **목표:** Next.js(Gateway)와 n8n(Logic Orchestrator)을 연동하여, 사주 분석 결과와 대화 맥락을 결합한 안전하고 매력적인 상담 챗봇을 구현한다.

---

## 1. 시스템 아키텍처 (System Architecture)

### 1.1 하이브리드 구조

- **Next.js (API Gateway):** 사용자 인증, 입력 값 검증, n8n Webhook 중계(Proxy) 역할.
- **n8n (Workflow Engine):** 실제 비즈니스 로직(DB 조회, LLM 호출, 페르소나 적용) 수행.
- **Supabase (Database):** 사주 데이터, 채팅 내역, 사용자 정보 저장소.
- **Railway (Infra):** n8n 서버 호스팅 환경.

### 1.2 데이터 흐름 (Data Flow)

1.  **User:** 질문 입력.
2.  **Next.js:** `chart_id` 소유권 검증 → `n8n Webhook`으로 Secure POST 전송.
3.  **n8n:**
    - `chart_id`로 DB에서 **분석 결과(`chart_analysis_results`) 직접 조회** (Client Data 무시).
    - 질문 의도 분류 (Fact vs Advice/Story).
    - **Phase 1:** 페르소나(`master_persona_vibe`) 주입.
    - **Phase 2:** 필요시 RAG(Vector DB) 검색 (선택).
    - LLM 응답 생성 및 JSON 포맷팅.
4.  **Next.js:** n8n 응답 수신 → 클라이언트 반환.

---

## 2. 인프라 및 배포 전략 (Infrastructure)

### 2.1 n8n 호스팅 (Railway)

- **Environment:** Docker (`n8nio/n8n`).
- **Networking:** Public Domain 확보 (예: `https://my-project.up.railway.app`).
- **Security:**
  - Next.js → n8n 호출 시 `N8N_API_KEY`를 Header에 포함하여 인증.
  - n8n 내부에는 Supabase Service Key를 환경변수로 등록하여 DB 접근 권한 부여.

### 2.2 Next.js 환경 변수

- `.env.local` 필수 항목:
  ```bash
  N8N_CHAT_WEBHOOK_URL="https://.../webhook/chat"
  N8N_API_KEY="your-secret-key"
  ```

---

## 3. API 명세 (Next.js Side)

### **POST /api/chat/message**

**기능:** 사용자의 메시지를 n8n으로 안전하게 전달하는 Proxy API.

**Request Body:**

```json
{
  "message": "나 요즘 연애가 너무 힘들어.",
  "chart_id": "uuid", // 필수: 대상 사주 차트 ID
  "session_id": "uuid" // 필수: 대화방 식별자
}
```

**Processing Logic (Server-Side):**

1.  **Auth Check:** 현재 로그인한 유저(`auth.uid()`) 확인.
2.  **Ownership Check:** 요청된 `chart_id`가 해당 유저의 소유인지 DB 조회. (불일치 시 403 Forbidden).
3.  **Idempotency:** `message_id`를 생성하여 n8n에 함께 전송 (네트워크 오류 시 중복 처리 방지).
4.  **Timeout:** 단계별 Timeout 설정 (아래 5.3절 참고).

**Response Schema:**

```json
{
  "reply_text": "언니가 보니까 지금 운이 좀 꼬여서 그래. 너무 자책하지 마.",
  "meta": {
    "tone": "warm_sister",
    "topic": "love",
    "severity": "info",
    "shareable_summary": "너는 '직진형 연애가이'야 💘",
    "is_premium_advice": false,
    "cta": {
      "type": "open_report",
      "target": "love",
      "label": "내 연애 리포트 더 보기"
    }
  }
}
```

---

## 4. n8n 워크플로우 설계 가이드 (Logic Specification)

### 4.1 데이터 조회 정책 (Server-Side Truth)

- **절대 규칙:** 클라이언트가 보낸 `logic_keys`나 사주 정보를 믿지 않는다.
- **실행:** n8n은 받은 `chart_id`를 이용해 Supabase의 `chart_analysis_results` 테이블을 조회하여 신뢰할 수 있는 데이터를 확보한다.

**조회 예시:**
```sql
SELECT logic_keys, summary 
FROM chart_analysis_results
WHERE chart_id = :chart_id
ORDER BY analyzed_at DESC
LIMIT 1;
```

---

### 4.2 RAG (검색 증강 생성) - 단계별 구현

#### **Phase 1: RAG 없이 시작 (MVP - 지금)**

**워크플로우:**
```
1. chart_id 받음
2. chart_analysis_results 조회 → logic_keys 획득
3. master_interpretations 조회 (logic_keys 기반)
4. 조회된 텍스트를 LLM 프롬프트에 주입
5. LLM 응답 생성
```

**장점:**
- 구현 간단
- 즉시 시작 가능
- 현재 160개 데이터로 충분히 작동

**단점:**
- 복잡한 질문에 한계
- 사례/스토리 답변 약함

**예시 프롬프트:**
```
당신은 사주 상담 전문가입니다.

사용자 사주:
- 일주: 갑자
- 특성: 새로운 것을 시작하는 개척자형

사용자 통변:
"갑자일주는 큰 물에 새싹이 돋는 형상입니다. 직관력이 뛰어나며..."

사용자 질문: "나 요즘 연애가 너무 힘들어."

위 정보를 바탕으로 따뜻하게 답변하세요.
```

---

#### **Phase 2: RAG 추가 (Week 8 이후, 선택)**

**필요 조건:**
- Pinecone 또는 Supabase Vector 연동
- 명리학 자료 Embedding (현묘 CSV, 명리정종 등)
- Vector 검색 API 구축

**워크플로우:**
```
1. chart_id 받음
2. chart_analysis_results 조회
3. 질문 의도 분류 (Classifier)
   - fact: RAG 스킵
   - advice/story: RAG 실행
4. [RAG] Vector DB 검색 (Top 3)
5. master_interpretations + RAG 결과 결합
6. LLM 프롬프트 주입
7. LLM 응답 생성
```

**Classifier 규칙 (간단 버전):**
```javascript
function classifyIntent(question) {
  // Fact: 기본 정보 질문
  if (question.includes('무슨') || question.includes('뭐')) {
    return 'fact';
  }
  
  // Advice: 조언 요청
  if (question.includes('어떻게') || question.includes('방법')) {
    return 'advice';
  }
  
  // Story: 사례 요청
  if (question.includes('사례') || question.includes('예시')) {
    return 'story';
  }
  
  return 'fact'; // 기본값
}
```

**RAG 제약 조건:**
- 검색 결과는 **Top 3**까지만 사용
- 각 Chunk는 **최대 500자**로 제한 (비용 절감)
- 검색 Timeout: 10초

**예시 프롬프트 (RAG 포함):**
```
당신은 사주 상담 전문가입니다.

사용자 사주:
- 일주: 갑자
- 특성: 개척자형

사용자 통변:
"갑자일주는 큰 물에 새싹이 돋는 형상입니다..."

참고 자료 (실전 사례):
1. "갑자일주 여성은 연애에서 주도적입니다..."
2. "물이 많은 사주는 감정 기복이 심할 수 있어..."
3. "연애운이 막힐 때는 금 기운을 보충하세요..."

사용자 질문: "나 요즘 연애가 너무 힘들어."

위 정보와 참고 자료를 바탕으로 답변하세요.
```

---

### 4.3 페르소나 및 톤앤매너

#### **조회 로직 (구체화)**

**Step 1: 사용자가 선택한 페르소나 확인**
```sql
SELECT persona_id 
FROM user_preferences
WHERE user_id = :user_id;

-- 예: persona_id = 'DOHWADOR'
```

**Step 2: logic_key 기반 Hook 조회**
```sql
SELECT text, tone_note
FROM master_persona_vibe
WHERE logic_key = :logic_key  -- 예: 'ganji.daily.jia_zi'
  AND persona_id = :persona_id  -- 예: 'DOHWADOR'
  AND use_case = 'daily_one_liner'
ORDER BY priority DESC
LIMIT 1;

-- 결과: "ㄹㅇ 갑자는 직관 맛집ㅋㅋ..."
```

**Step 3: Hook을 System Prompt에 주입**
```javascript
const hook = queryResult.text;
const systemPrompt = `
${hook}

당신은 사주 상담 전문가입니다.
[말투 가이드]
- ${queryResult.tone_note}
- 이모지 적극 활용
- 짧고 임팩트 있게

사용자 사주:
- 일주: 갑자
...
`;
```

---

#### **페르소나별 특징**

| persona_id | 이름 | 특징 | tone_note |
|-----------|------|------|-----------|
| DOHWADOR | 도화도르 | 트렌디, 숏폼 | trendy_shortform |
| SUNWOON | 선운 | 전문가, 고전 | wise_professional |
| SISTER | 언니 | 따뜻한 공감 | warm_supportive |
| INTP | 기본 | 중립적 | neutral_informative |

**use_case 종류:**
- `daily_one_liner`: 일상 대화 시작
- `bad_day_comfort`: 힘들 때 위로
- `decision_help`: 결정 도움
- `celebration`: 좋은 일 축하

---

### 4.4 질문 의도 분류 (Intent Classification)

**3가지 카테고리:**

1. **fact** (사실 질문)
   - 예: "내 일주가 뭐야?", "갑자일주가 뭐야?"
   - 처리: DB 직접 조회, RAG 스킵

2. **advice** (조언 요청)
   - 예: "연애운 올리려면 어떻게 해?", "돈 벌려면?"
   - 처리: master_solutions 조회 + Phase 2 시 RAG

3. **story** (사례 요청)
   - 예: "갑자일주 성공 사례 있어?", "비슷한 사람들은?"
   - 처리: Phase 2 시 RAG (현묘 CSV 사례 검색)

---

## 5. 운영 정책 및 안전 가이드 (Safety & Ops)

### 5.1 안전 정책 (Safety Protocol)

- **Decision Making:** LLM은 이별, 퇴사, 투자에 대해 단정적인 "결정"을 내릴 수 없다. 선택지와 관점만 제시한다.
- **Critical Handling:** `severity: critical` 주제(건강, 법률 등) 감지 시, 답변 하단에 **"전문가와 상의해 보세요"** 문구를 강제 부착한다.

**LLM System Prompt에 포함:**
```
[중요 제약사항]
- 이별, 퇴사, 투자에 대해 단정적으로 "하세요" 또는 "하지 마세요"라고 말하지 마세요
- 대신 "~하는 선택도 있고, ~하는 방법도 있어요" 형태로 제시
- 건강, 법률 관련 질문은 "전문가와 상의하세요" 문구 필수
```

---

### 5.2 에러 핸들링

#### **에러 시나리오별 처리**

1. **Timeout/Error**
   ```json
   {
     "error": "TIMEOUT",
     "reply_text": "도사님이 깊게 고민 중이시라 연결이 지연되고 있어요. 잠시 후 다시 시도해 주세요.",
     "meta": { "severity": "error" }
   }
   ```

2. **chart_id 소유권 없음**
   ```json
   {
     "error": "FORBIDDEN",
     "reply_text": "이 사주에 접근할 권한이 없습니다.",
     "meta": { "severity": "error" }
   }
   ```

3. **DB 데이터 없음**
   - Fallback: "아직 이 부분에 대한 자료를 준비 중이에요. 조금만 기다려주세요!"

---

### 5.3 Timeout 전략 (개선)

#### **Phase 1: 단순 조회 (현재)**
```javascript
const TIMEOUTS = {
  DB_QUERY: 5000,        // DB 조회: 5초
  LLM_RESPONSE: 30000,   // LLM 응답: 30초
  TOTAL: 40000           // 전체: 40초
};

// n8n 호출 시
const response = await fetch(N8N_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'X-API-Key': N8N_API_KEY },
  body: JSON.stringify({ chart_id, message, session_id }),
  signal: AbortSignal.timeout(TIMEOUTS.TOTAL)
});
```

#### **Phase 2: RAG 추가 (Week 8 이후)**
```javascript
const TIMEOUTS = {
  DB_QUERY: 5000,         // DB 조회: 5초
  VECTOR_SEARCH: 10000,   // Vector 검색: 10초
  LLM_RESPONSE: 60000,    // LLM 응답: 60초
  TOTAL: 80000            // 전체: 80초
};
```

#### **Streaming 고려 (선택)**
LLM Streaming 응답 사용 시:
- 첫 토큰까지: 10초
- 이후 연결 유지: 무제한
- 사용자 경험 향상 (답변이 실시간으로 생성되는 느낌)

```javascript
// Streaming 예시 (OpenAI)
const stream = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }],
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    // 클라이언트에 실시간 전송
    res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
}
```

---

### 5.4 로깅 및 모니터링

**필수 로그:**
```javascript
logger.info({
  endpoint: '/api/chat/message',
  user_id,
  chart_id,
  session_id,
  message_length: message.length,
  intent_classified: 'advice',  // fact/advice/story
  persona_used: 'DOHWADOR',
  rag_used: false,              // Phase 2
  llm_tokens: 1234,
  duration_ms: 3456,
  response_length: reply_text.length
});
```

**에러 로그:**
```javascript
logger.error({
  endpoint: '/api/chat/message',
  chart_id,
  error_type: 'TIMEOUT',
  error_message: err.message,
  stack_trace: err.stack
});
```

---

## 6. 구현 가이드

### 6.1 Phase 1 구현 (지금 당장)

**n8n 워크플로우 노드:**
```
1. [Webhook] 메시지 수신
2. [Supabase] chart_analysis_results 조회
3. [Supabase] master_interpretations 조회
4. [Supabase] master_persona_vibe 조회
5. [Function] System Prompt 생성
6. [OpenAI] LLM 호출
7. [Function] JSON 포맷팅
8. [Respond to Webhook] 응답 반환
```

**예상 소요 시간:** 2~3일

---

### 6.2 Phase 2 구현 (Week 8 이후, 선택)

**추가 노드:**
```
3.5 [Function] Intent Classifier
3.6 [IF] intent === 'advice' or 'story'?
3.7   [Pinecone/Supabase Vector] RAG 검색
3.8   [Function] RAG 결과 결합
```

**예상 소요 시간:** 3~5일

---

## 7. 테스트 시나리오

### 7.1 기본 테스트 (Phase 1)

**시나리오 1: 사실 질문**
```
Input: "내 일주가 뭐야?"
Expected: "당신은 갑자일주예요. 큰 물에 새싹이 돋는..."
```

**시나리오 2: 조언 요청**
```
Input: "연애운 올리려면?"
Expected: "갑자일주는 물 기운이 강해서 금 기운을 보충하면 좋아요..."
```

**시나리오 3: 페르소나 변경**
```
Persona: DOHWADOR
Input: "요즘 힘들어"
Expected: "ㄹㅇ 운이 좀 꼬인 타이밍ㅇㅇ 근데 이것도 지나가..."

Persona: SISTER
Input: "요즘 힘들어"
Expected: "힘들지? 언니가 보기엔 네가 너무 열심히 해서 그래..."
```

---

### 7.2 에러 테스트

**시나리오 1: 소유권 없음**
```
Input: 다른 사람의 chart_id
Expected: 403 Forbidden
```

**시나리오 2: Timeout**
```
Input: LLM 응답 지연
Expected: "도사님이 깊게 고민 중이시라..."
```

**시나리오 3: 데이터 없음**
```
Input: 아직 추가 안 된 domain (예: health)
Expected: Fallback 응답
```

---

## 8. 성능 목표

| 지표 | Phase 1 목표 | Phase 2 목표 |
|------|-------------|-------------|
| 평균 응답 시간 | < 5초 | < 8초 |
| 95% 응답 시간 | < 10초 | < 15초 |
| Timeout 발생률 | < 1% | < 2% |
| 에러율 | < 0.5% | < 1% |

---

**수정 이력:**
- v2.6 → v2.7: RAG 단계별 구현 추가, 페르소나 조회 로직 구체화, Timeout 전략 상세화 (2024-12-12)
---

# ✅ [추가 반영] 강제 섹션 2개 + DB/운영 잠금 (v3.0 Patch)

> 기존 PRD3_REVISED(v2.7) 본문을 훼손하지 않고, 이번 대화에서 확정된 “강제 스펙”을 추가로 고정하는 **append-only** 섹션입니다.  
> 충돌 시 이 섹션을 우선 적용합니다.

## A. 정책 Lock (강제)
- 유료 콘텐츠 프론트 숨김 금지 → **Next.js 서버 필터링**
- 상담 단독 판매 금지 → `사주풀이 단독` 또는 `사주풀이+상담 패키지` + `추가 상담 결제`
- 사주채팅은 **사주풀이(리포트) 이후에만 가능**
- Client → n8n 직결 금지 → **Next.js Gateway → n8n**
- 차감: **assistant 저장 성공 1회 = 1차감**, 실패/타임아웃=0차감
- 한도 체크: 상담 시작 전 + 매 메시지
- 시기 단정 금지 → timing_signals + timing_window_hint만 사용
- 프롬프트에 요약 2개 동시 주입 금지(구조화+텍스트)

## B. n8n 비용/토큰 운영 규칙 (강제)
### B.1 컨텍스트 예산(문자)
- DB 발췌 총합: **최대 2,000자**
- chart_facts_pack: 600~900자(항상 포함)
- session_summary: 600~700자
- recent messages: 대략 1,200자 내
- system/rules: 800자
- 응답: 700~1,200자(필요 시 1,800자)

### B.2 요약 트리거(수정 확정)
- 누적 1500자 OR 6턴 OR 핵심 이벤트

### B.3 캐시(수정 확정: intent 제거)
- intent 대신 `topic_bucket(primary/secondary)` 사용
- 우선순위: timing > money > work > love > family > health > general
- 2단 캐시:
  - L1 Exact: owner + bound_chart + topic_primary + message_hash
  - L2 Bucket: owner + bound_chart + topic_primary 후보 중 유사도 선택

### B.4 JSON 요약 안전장치
- JSON Repair → Validate → Fallback
- Fallback 3회 연속이면 text_only 전환 + Warning 로그

### B.5 빈 문자열('') 강제(공백 금지)
- null/undefined/공백은 프롬프트에 흘리지 말고 **''**로 치환
- n8n Code Node(JS)에서 강제

## C. DB 컬럼/제약 변경 여부 (추가 가능성 높음)
> 현재 DB 정본 SQL을 못 봤기 때문에 “이미 있는지”는 단정 불가.  
> 다만 아래가 없으면 이번 강제 스펙을 DB가 보장할 수 없습니다.

### C.1 필수(사고 방지)
- `chat_messages(owner_id, idempotency_key)` UNIQUE 인덱스
- 저장+차감 원자 RPC (예: save_assistant_and_deduct)
- Phase2 권한 확정/잠금 트랜잭션:
  - entitlement: bound_chart_id
  - chart: is_locked(또는 locked_at)

### C.2 강권장(비용/품질)
- chat_sessions:
  - summary_mode, summary_fail_streak, summary_last_ok_at
  - session_summary_structured, session_summary_text
- 캐시 저장소(테이블 또는 Redis) + TTL(권장 7일)

### C.3 Phase1(만세력)
- 게스트 DB 저장 금지(A) 확정 → expires_at/cron 삭제 정책은 **현 단계 불필요**

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
