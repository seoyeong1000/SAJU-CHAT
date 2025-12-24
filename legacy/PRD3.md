# 📘 [Phase 3] AI Persona Chatbot PRD (Final v2.6)

**문서 정보**

- **프로젝트:** Saju Life Solution - Persona Chatbot
- **버전:** v2.6 (n8n on Railway + Server-Side Truth + Safety Policy)
- **목표:** Next.js(Gateway)와 n8n(Logic Orchestrator)을 연동하여, 사주 분석 결과와 대화 맥락을 결합한 안전하고 매력적인 상담 챗봇을 구현한다.

---

## 1\. 시스템 아키텍처 (System Architecture)

### 1.1 하이브리드 구조

- **Next.js (API Gateway):** 사용자 인증, 입력 값 검증, n8n Webhook 중계(Proxy) 역할.
- **n8n (Workflow Engine):** 실제 비즈니스 로직(DB 조회, RAG 검색, LLM 호출, 페르소나 적용) 수행.
- **Supabase (Database):** 사주 데이터, 채팅 내역, 사용자 정보 저장소.
- **Railway (Infra):** n8n 서버 호스팅 환경.

### 1.2 데이터 흐름 (Data Flow)

1.  **User:** 질문 입력.
2.  **Next.js:** `chart_id` 소유권 검증 → `n8n Webhook`으로 Secure POST 전송.
3.  **n8n:**
    - `chart_id`로 DB에서 **분석 결과(`chart_analysis_results`) 직접 조회** (Client Data 무시).
    - 질문 의도 분류 (Fact vs Advice/Story).
    - 필요시 RAG(Vector DB) 검색 및 페르소나(`master_persona_vibe`) 주입.
    - LLM 응답 생성 및 JSON 포맷팅.
4.  **Next.js:** n8n 응답 수신 → 클라이언트 반환.

---

## 2\. 인프라 및 배포 전략 (Infrastructure)

### 2.1 n8n 호스팅 (Railway)

- **Environment:** Docker (`n8nio/n8n`).
- **Networking:** Public Domain 확보 (예: `https://my-project.up.railway.app`).
- **Security:**
  - Next.js → n8n 호출 시 `N8N_API_KEY`를 Header에 포함하여 인증.
  - n8n 내부에는 Supabase Service Key를 환경변수로 등록하여 DB 접근 권한 부여.

### 2.2 Next.js 환경 변수

- `.env.local` 필수 항목:
  ```bash
  N8N_CHAT_WEBHOOK_URL="https://.../webhook/..."
  N8N_API_KEY="your-secret-key"
  ```

---

## 3\. API 명세 (Next.js Side)

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
4.  **Timeout:** n8n 호출 타임아웃을 **30초\~60초**로 넉넉하게 설정.

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

## 4\. n8n 워크플로우 설계 가이드 (Logic Specification)

### 4.1 데이터 조회 정책 (Server-Side Truth)

- **절대 규칙:** 클라이언트가 보낸 `logic_keys`나 사주 정보를 믿지 않는다.
- **실행:** n8n은 받은 `chart_id`를 이용해 Supabase의 `chart_analysis_results` 테이블을 조회하여 신뢰할 수 있는 데이터를 확보한다.

### 4.2 RAG (검색 증강 생성) 최적화

- **Trigger:** 모든 질문에 RAG를 쓰지 않는다. Classifier(규칙 기반)를 통해 질문 유형이 **`advice`(조언) 또는 `story`(사례)** 일 때만 Vector DB를 검색한다.
- **Constraints:**
  - 검색 결과는 **Top 3**까지만 사용.
  - 각 Chunk는 **최대 500자**로 제한 (비용 절감).

### 4.3 페르소나 및 톤앤매너

- `master_persona_vibe` 테이블에서 `logic_key` (사주 특성) 또는 `context_key` (대화 상황)에 맞는 Hook 멘트를 조회하여 System Prompt에 주입한다.

---

## 5\. 운영 정책 및 안전 가이드 (Safety & Ops)

### 5.1 안전 정책 (Safety Protocol)

- **Decision Making:** LLM은 이별, 퇴사, 투자에 대해 단정적인 "결정"을 내릴 수 없다. 선택지와 관점만 제시한다.
- **Critical Handling:** `severity: critical` 주제(건강, 법률 등) 감지 시, 답변 하단에 **"전문가와 상의해 보세요"** 문구를 강제 부착한다.

### 5.2 에러 핸들링

- **Timeout/Error:** n8n 응답 실패 시, Next.js는 클라이언트에게 **"도사님이 깊게 고민 중이시라 연결이 지연되고 있어요. 잠시 후 다시 시도해 주세요."** (Friendly Message)를 반환한다.
- **Logging:** 상세 에러(Stack Trace)는 서버 내부 로그에만 남긴다.

---
