# 📘 [Phase 2] Saju Analysis & Interpretation Engine PRD (Final v2.3)

**문서 정보**
* **프로젝트:** Saju Life Solution - Analysis & Interpretation Core
* **목표:** Phase 1(만세력) 결과를 분석하여 로직 키를 추출하고, DB를 조회하여 사용자 리포트를 생성한다.

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

## 2. 데이터베이스 스키마 (참조)
* **Tables:** `master_logic_definitions`, `master_interpretations`, `master_solutions`.
* **Key constraint:** `logic_key`는 불변 식별자이며, 버전 관리는 `version` 필드와 `is_active` 플래그로 한다.