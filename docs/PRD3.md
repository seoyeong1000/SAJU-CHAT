# 📘 [Phase 3] AI Persona Chatbot PRD (Final v2.3)

**문서 정보**
* **프로젝트:** Saju Life Solution - Persona Chatbot
* **목표:** 사주 데이터와 대화 맥락을 결합하여 페르소나 기반 상담을 제공한다.

## 1. API 명세 및 데이터 신뢰성

### **POST /api/chat/message**
* **Request:**
    * `message`: 사용자 질문
    * `chart_id`: 사주 차트 ID (UUID)
    * `session_id`: 대화 세션 ID (필수)
    * `history`: 이전 대화 내역
* **Validation Rule (Server-Side Truth):**
    * 클라이언트가 `logic_keys`를 보내더라도 **절대 신뢰하지 않는다.**
    * 서버는 반드시 `chart_id`를 사용하여 DB에서 직접 `logic_keys`와 `report_summary`를 조회해야 한다.

## 2. 시스템 아키텍처

### 2.1 세션 관리 (Session Context)
* 모든 대화는 `session_id` 기준으로 관리된다.
* `chat_state` (현재 주제, 대화 상대 등)는 DB에 저장하여 문맥을 유지한다.

### 2.2 RAG (검색 증강 생성) 최적화
* **Trigger:** 모든 질문에 RAG를 쓰지 않는다. Classifier(규칙 기반)를 통해 질문 유형이 **`advice`(조언) 또는 `story`(사례)** 일 때만 Vector DB를 검색한다.
* **Constraints:**
    * 검색 결과는 **Top 3**까지만 사용.
    * 각 Chunk는 **최대 500자**로 제한 (비용 절감).

## 3. Safety & Persona
* **Safety Rule:** LLM은 이별, 퇴사, 투자에 대해 단정적인 "결정"을 내릴 수 없다. `severity: critical` 주제는 전문가 상담 권유 문구를 강제한다.
* **Persona:** `master_persona_vibe` 테이블에서 `logic_key` 또는 `context_key`에 맞는 Hook 멘트를 가져와 답변에 섞는다.