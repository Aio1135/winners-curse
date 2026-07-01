# 승자의 저주 (Winner's Curse)

AI 입찰자를 상대로 경매 이론을 공략하는 싱글플레이 웹 게임.
플레이어는 스테이지마다 다른 경매 방식(영국식/네덜란드식/비공개 1가/Vickrey)으로
AI들과 경쟁하며, 매 라운드 복기 화면을 통해 경매 이론을 체득한다.

**핵심 재미**: 입찰 순간의 긴장 + 복기에서 "아 그래서 걔가 그랬구나"를 깨닫는 이해의 쾌감.
참고 포지셔닝: Bid King(멀티 심리전)과 반대로, AI 상대 싱글 전략 퍼즐. Nicky Case류 인터랙티브 샌드박스 감성.

---

## 0. 절대 규칙 (스코프 가드)

- 순수 프론트엔드. 백엔드/서버/DB/계정 시스템 절대 금지.
- 멀티플레이 금지. 사운드 금지. 아이템 아트 금지 (이모지 + 텍스트로 대체).
- 진행 저장은 메모리 상태 + JSON 내보내기/불러오기만. (localStorage 사용 금지 — 배포 환경 제약)
- 모든 랜덤은 시드 RNG(`engine/rng.ts`)를 통해서만. `Math.random()` 직접 호출 금지.
- 경매 룰·수치 로직은 UI와 완전 분리. `engine/`은 React를 import하지 않는다.
- 이 문서에 없는 기능을 임의로 추가하지 말 것. 제안은 하되 구현 전 확인받기.

## 1. 기술 스택

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS
- 상태 관리: useReducer + Context (외부 상태 라이브러리 금지)
- 그래프/시각화 필요 시 recharts
- 테스트: Vitest — `engine/` 로직만 테스트. UI 테스트는 쓰지 않는다.
- 배포: Vercel (정적 빌드)

## 2. 파일 구조

```
src/
  engine/          # 순수 로직. React 금지. 전부 순수 함수.
    rng.ts         # 시드 RNG (mulberry32). 모든 랜덤의 단일 출처
    types.ts       # 공용 타입 정의
    items.ts       # 아이템 생성 (진짜 가치 + 감정치 노이즈 + 카테고리)
    auction.ts     # runAuction() — 4개 방식의 판정 로직
    settle.ts      # 낙찰 판정, 손익 계산, 승자의 저주 판정
    review.ts      # 복기 데이터 생성 (판별 피드백 포함)
    stage.ts       # 스테이지 정의 로딩, 클리어/별점 판정
  bidders/         # AI 입찰자. engine만 import 가능
    types.ts       # Bidder 인터페이스
    honest.ts, bulldozer.ts, miser.ts, sniper.ts, cartel.ts
  stages/
    stages.ts      # 스테이지 8개 데이터 (§7 커리큘럼과 1:1)
  ui/
    screens/       # StageSelect, Briefing, AuctionRoom, Review, Result
    components/    # BidPanel(방식별), ItemCard, BidderAvatar, StarRating ...
    state/         # gameReducer, GameContext
  App.tsx
```

## 3. 게임 플로우 상태 머신

전역 상태는 단일 리듀서로 관리. 화면 = 상태의 함수.

```
STAGE_SELECT
  → (스테이지 선택) → BRIEFING
BRIEFING              # 경매 방식, 예산, 클리어 조건, AI 소개
  → (시작) → ROUND_INTRO
ROUND_INTRO           # 아이템 공개 + 내 감정치 제시
  → JUDGEMENT
JUDGEMENT             # 감정 의뢰(코인 소모) / 패스 / 입찰 진입
  → (패스) → SETTLE   # 패스해도 AI끼리 경매는 진행됨
  → (입찰) → BIDDING
BIDDING               # 방식별 UI (§5)
  → SETTLE
SETTLE                # 낙찰자 확정, 진짜 가치 공개, 손익 반영
  → REVIEW
REVIEW                # 전원 감정치·입찰 근거 공개 + 판별 피드백
  → (라운드 남음) → ROUND_INTRO
  → (마지막 라운드) → RESULT
RESULT                # 확보 가치 합계, 클리어 판정, 별점
  → STAGE_SELECT
```

리듀서 액션 예: `SELECT_STAGE`, `START_STAGE`, `REQUEST_APPRAISAL`, `PASS_ROUND`,
`ENTER_BIDDING`, `PLAYER_BID`, `PLAYER_DROP`, `TICK`(실시간 방식용), `NEXT_ROUND`, `EXIT_STAGE`.

## 4. 가치·감정치 시스템 (공통가치 모델)

- 아이템의 **진짜 가치 V**는 스테이지 정의 범위에서 생성. 낙찰 전엔 누구에게도 비공개.
- 각 참가자(플레이어 포함)는 감정치 `s_i = V × (1 + ε_i)`를 받는다.
  ε_i ~ Uniform(−σ, +σ), 기본 σ = 0.3 (스테이지별 조정 가능).
- **감정 의뢰**: 코인 1개 소모 → 해당 아이템의 σ를 0.1로 재추첨. 라운드당 1회.
  코인은 스테이지 시작 시 지급(기본 2개), 아끼면 별점 조건에 쓰일 수 있음.
- 낙찰 손익 = V − 낙찰가. **승자의 저주** = 낙찰했는데 손익 < 0.
- UI에는 항상 "감정치 800 (오차 ±30%)" 형태로 표기. 진짜 가치는 SETTLE에서만 공개.

## 5. 경매 방식 4종 — 정확한 룰

공통: 참가자 = 플레이어 1 + AI 2~4. 동점 시 시드 RNG로 무작위 결정.
AI의 최대지불의사(WTP)는 각 성격 로직이 감정치·예산에서 계산 (§6).

### 5.1 영국식 (english) — 공개 상승, 실시간
- 시작가 = V 생성 범위 하한의 50%. 호가는 5% 스텝으로 자동 상승 (800ms 틱).
- 매 틱마다 각 AI는 잔류/탈락 결정 (자신의 WTP 초과 시 탈락).
- 플레이어는 "따라간다"를 유지하거나 "포기" 버튼으로 탈락.
- 마지막 1인이 남으면 그 호가에서 낙찰. 이론 포인트: 차순위 WTP 근처에서 낙찰됨.

### 5.2 네덜란드식 (dutch) — 공개 하강, 실시간
- 시작가 = V 생성 범위 상한의 150%. 3% 스텝으로 하강 (700ms 틱).
- 누구든 먼저 "낙찰" 버튼(AI는 자기 목표가 도달 시)을 누르면 그 가격에 즉시 종료.
- 아무도 안 누르고 하한(상한의 20%) 도달 시 유찰.
- 이론 포인트: 비공개 1가와 전략적으로 동치. 기다림 = 이득이지만 리스크.

### 5.3 비공개 1가 (sealed-first) — 턴제
- 전원이 동시에 입찰액 1개 제출 (0 = 불참).
- 최고가가 **자기 입찰액**을 지불하고 낙찰.
- 이론 포인트: 감정치보다 낮춰 부르는 것(bid shading)이 합리적.

### 5.4 Vickrey / 비공개 2가 (sealed-second) — 턴제
- 전원이 동시에 제출. 최고가가 낙찰하되 **2등 가격**을 지불.
- 이론 포인트: 자기 평가액을 정직하게 부르는 것이 (약)우월전략.
- 복기에서 반드시 검증: 플레이어가 감정치와 다르게 불렀으면 손익 차이를 계산해 피드백.

## 6. AI 입찰자 스펙

인터페이스 (bidders/types.ts):
```ts
interface BidderContext {
  appraisal: number;      // 자신의 감정치
  budget: number;         // 남은 예산
  auctionType: AuctionType;
  itemCategory: ItemCategory; // 이번 아이템 카테고리 (공개 정보)
  roundIndex: number;
  totalRounds: number;
  history: RoundRecord[]; // 지난 라운드 공개 정보
  rng: Rng;
}
interface Bidder {
  id: string; name: string; emoji: string;
  tagline: string;        // 브리핑 화면 한 줄 소개 (성격 힌트)
  decide(ctx: BidderContext): BidderPlan;
  // BidderPlan = { wtp: number }  — 방식별 행동은 엔진이 wtp에서 파생
  reviewLine(ctx, outcome): string; // 복기 대사. 반드시 자기 로직을 정직하게 설명
}
```

성격 5종 (wtp 계산 규칙):
| id | 이름 | 로직 |
|---|---|---|
| honest | 감정사 | wtp = 감정치 × 1.0. 기준선 역할 |
| bulldozer | 불도저 | wtp = 감정치 × (1.15~1.3 랜덤). 예산 무시 성향, 승자의 저주 단골 |
| miser | 구두쇠 | wtp = min(감정치 × 0.8, 남은예산 × 0.3). 절대 무리 안 함 |
| sniper | 스나이퍼 | 영국식/네덜란드식 전용 감각: wtp = 감정치 × 0.95지만 막판까지 행동 숨김(영국식에선 탈락한 척 리엔트리 없음 — 대신 잔류 표시를 애매하게). 턴제에선 honest와 동일 |
| cartel | 담합조 (2인 1조) | 서로의 감정치 중 높은 쪽만 wtp = 감정치 × 1.0으로 입찰, 다른 쪽은 wtp = 0. 낙찰 이익은 공유(연출상). 복기에서 담합 사실 공개 |

원칙: AI는 절대 플레이어의 감정치나 입력을 훔쳐보지 않는다 (공정성).
AI가 아는 것 = 자기 감정치, 공개 호가, 아이템 카테고리, 지난 라운드의 공개 기록뿐.

### 6.1 행동 변주 (단조로움 방지)

- 아이템 카테고리 4종: 시계 / 미술품 / 골동품 / 수집품. ROUND_INTRO에서 공개 정보.
- **선호 카테고리**: 스테이지 데이터(`BidderSpec.preferredCategory`)로 AI에게 부여.
  해당 카테고리 아이템에는 wtp × 1.15 (수치는 D5 밸런싱 대상).
  브리핑 화면에 "OO 애호가"로 힌트를 노출해 플레이어가 읽고 대응할 수 있게 한다.
- **상황 반응형**:
  - bulldozer: 연속 미낙찰 1회당 wtp 배율 +0.05 (최대 +0.15). 지면 열받는다.
  - miser: 마지막 2라운드에 진입했는데 무낙찰이면 상한 완화 — min(감정치×0.9, 예산×0.45).
  - honest: 변주 없음. 기준선 역할 유지 (선호 카테고리도 부여하지 않는 것을 권장).
- 모든 변주는 복기 대사(`reviewLine`)에서 반드시 정직하게 설명한다.

## 7. 스테이지 커리큘럼 (8개)

| # | 제목 | 방식 | 라운드 | 상대 | 배우는 것 | 특이 조건 |
|---|---|---|---|---|---|---|
| 1 | 첫 망치소리 | english | 3 | honest×2 | 기본 룰, 차순위 낙찰 감각 | σ=0.1 (거의 정확한 감정) |
| 2 | 봉투 속 숫자 | sealed-first | 4 | honest, miser | bid shading | σ=0.2 |
| 3 | 정직의 역설 | sealed-second | 4 | honest, bulldozer | 진실 입찰이 최적 | 복기 검증 강조 |
| 4 | 내려가는 시계 | dutch | 4 | honest, sniper | 타이밍 vs 탐욕 | — |
| 5 | 승자의 저주 | sealed-first | 5 | bulldozer×2 | 공통가치 함정 | σ=0.4, 감정 의뢰 중요 |
| 6 | 짬짜미 | english | 5 | cartel(2), honest | 담합 인지와 대응 | 복기에서 담합 공개 |
| 7 | 스나이퍼의 밤 | dutch | 5 | sniper×2, miser | 상대 패턴 읽기 | 호가 하강 속도 랜덤 |
| 8 | 그랜드 옥션 | 라운드마다 방식 랜덤 | 6 | 전 성격 믹스 | 종합 | σ=0.35, 코인 3개 |

클리어 조건(공통 틀): 확보한 진짜 가치 합계 ≥ 목표치 (스테이지별 수치는 stages.ts에서 밸런싱).
별점: ★ 클리어 / ★★ 예산 20% 이상 잔여 / ★★★ 승자의 저주 0회.
언락: 이전 스테이지 ★ 이상.

## 8. 복기 화면 요구사항 (게임의 심장)

SETTLE 직후 반드시 표시:
1. 전원의 감정치 vs 진짜 가치 (막대 비교)
2. 전원의 입찰액/탈락 시점과 각 AI의 `reviewLine` 대사
3. **판별 피드백** (engine/review.ts가 계산):
   - Vickrey에서 감정치 ≠ 입찰액 → 정직 입찰 대비 손익 차이 제시
   - 네덜란드식에서 낙찰 시 → "N틱 더 기다렸으면 X 절약 (단, AI 목표가는 Y였음)" 
   - 승자의 저주 발생 시 → 감정치 분포와 V의 관계 설명 한 줄
   - 패스한 라운드 → 참여했다면 어땠을지 요약 1줄
4. 피드백 문구는 review.ts에 순수 함수로 — 하드코딩 문자열 + 수치 삽입. LLM 호출 없음.

## 9. 코딩 컨벤션

- 함수형 우선, 클래스 금지 (Bidder도 객체 리터럴 팩토리).
- engine/의 모든 함수는 (입력, rng) => 출력 순수 함수. 같은 시드 = 같은 게임 재현 보장.
- 금액은 정수만 사용 (부동소수 금지). 표기 시 천 단위 콤마.
- 한국어 UI 텍스트는 ui/text.ts 한 파일에 모은다.
- 커밋 단위: 기능 1개 = 커밋 1개. 메시지는 한국어 명령형 ("영국식 경매 엔진 추가").
- 각 엔진 함수에는 최소 1개 Vitest 케이스 (특히 §5 룰의 경계: 동점, 유찰, 예산 0).

## 10. 7일 로드맵 (작업 지시는 이 단위로)

- D1: 프로젝트 세팅, rng/types/items, 화면 3개 골격, 리듀서 뼈대
- D2: sealed-first + sealed-second 엔진·UI, honest/bulldozer/miser, 복기 v1 → **한 판 완주 가능** 상태
- D3: english + dutch 실시간 엔진·연출 (틱 기반, TICK 액션)
- D4: 공통가치·감정 의뢰 시스템, 승자의 저주 판정, review.ts 판별 피드백
- D5: 스테이지 8개 데이터 + sniper/cartel + 밸런싱 (수치는 사람이 결정)
- D6: 복기 v2, 별점/언락, 진행 내보내기/불러오기, UI 폴리시
- D7: 버퍼, Vercel 배포, README

**Claude Code 위임 규칙**: 엔진/AI처럼 룰이 명확한 부분(§4~6, §8)은 이 문서를 근거로
자율 구현 OK. 게임필(틱 속도, 연출, 밸런스 수치)은 반드시 사람 확인 후 반영.
막히면 임의 판단하지 말고 질문으로 멈출 것.
