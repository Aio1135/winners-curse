// 한국어 UI 텍스트는 전부 이 파일에 모은다.

/** 금액 표기: 정수 + 천 단위 콤마 */
export function formatMoney(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

export const AUCTION_TYPE_LABEL = {
  english: '영국식 (공개 상승)',
  dutch: '네덜란드식 (공개 하강)',
  'sealed-first': '비공개 1가 (최고가 지불)',
  'sealed-second': 'Vickrey · 비공개 2가 (2등 가격 지불)',
  mixed: '라운드마다 방식 랜덤',
} as const;

export const TEXT = {
  app: {
    title: '승자의 저주',
    subtitle: 'AI 입찰자를 상대로 경매 이론을 공략하는 전략 퍼즐',
  },
  playerName: '나',
  stageSelect: {
    heading: '스테이지 선택',
    stageLabel: (id: number) => `스테이지 ${id}`,
    comingSoon: '준비 중',
  },
  briefing: {
    heading: '브리핑',
    auctionType: '경매 방식',
    rounds: '라운드',
    roundsValue: (n: number) => `${n}라운드`,
    budget: '시작 예산',
    coins: '감정 코인',
    coinsValue: (n: number) => `${n}개`,
    target: '클리어 조건',
    targetValue: (n: number) => `확보 가치 합계 ${formatMoney(n)} 이상`,
    opponents: '오늘의 상대',
    preferenceHint: (category: string) => `${category} 애호가`,
    start: '경매 시작',
    back: '스테이지 선택으로',
  },
  appraisal: {
    label: (value: number, sigma: number) =>
      `감정치 ${formatMoney(value)} (오차 ±${Math.round(sigma * 100)}%)`,
    refreshed: '감정 의뢰 완료 — 오차가 줄었다!',
  },
  auctionRoom: {
    round: (current: number, total: number) => `라운드 ${current} / ${total}`,
    budget: '예산',
    coins: '감정 코인',
    confirmItem: '입찰 준비',
    requestAppraisal: '감정 의뢰 (코인 1)',
    pass: '이번 라운드 패스',
    enterBidding: '입찰 참여',
    exit: '스테이지 나가기',
    phaseIntro: '아이템 공개',
    phaseJudgement: '판단의 시간',
    phaseBidding: '입찰 중',
  },
  bidding: {
    sealedFirstHint: '전원 동시 제출. 최고가가 자기 입찰액을 그대로 지불한다.',
    sealedSecondHint: '전원 동시 제출. 최고가가 낙찰하되 2등 가격만 지불한다.',
    amountLabel: '입찰액',
    submit: '봉투 제출',
    zeroNote: '0 = 불참',
    englishHint: '호가가 자동으로 오른다. 한계다 싶으면 포기 — 마지막 1인이 그 호가에 낙찰된다.',
    dutchHint: '가격이 계속 내려간다. 먼저 낙찰 버튼을 누르면 그 가격에 가져간다. 기다릴수록 싸지만, 뺏길 수 있다.',
    currentPrice: '현재 호가',
    dutchPrice: '현재 가격',
    drop: '포기',
    claim: '낙찰!',
    inAuction: '경합 중',
    notEntered: '불참',
    watching: '탈락했다 — 남은 경매를 지켜보는 중…',
    overBudget: '예산이 모자라 지금 가격에는 살 수 없다',
    floorNote: (n: number) => `${formatMoney(n)}까지 내려가면 유찰`,
  },
  settle: {
    heading: '낙찰 정산',
    passed: '유찰 — 아무도 낙찰하지 않았다',
    winner: '낙찰자',
    price: '낙찰가',
    trueValue: '진짜 가치',
    profit: '낙찰 손익',
    winnersCurse: '⚡ 승자의 저주! 진짜 가치보다 비싸게 샀다',
    toReview: '복기 보기',
  },
  review: {
    heading: '복기',
    trueValueBar: '진짜 가치',
    bidLabel: (n: number) => `입찰 ${formatMoney(n)}`,
    wonAt: (n: number) => `낙찰 ${formatMoney(n)}`,
    droppedAt: (n: number) => `${formatMoney(n)}에서 탈락`,
    targetWas: (n: number) => `목표가 ${formatMoney(n)}`,
    notClaimed: '누르지 않음',
    noBid: '불참',
    winnerBadge: '낙찰',
    next: '다음 라운드',
    toResult: '결과 보기',
  },
  result: {
    heading: '최종 결과',
    acquired: '확보한 진짜 가치',
    target: '목표치',
    cleared: '🎉 클리어!',
    failed: '실패… 다시 도전해보자',
    budgetLeft: '남은 예산',
    curseCount: (n: number) => `승자의 저주 ${n}회`,
    backToSelect: '스테이지 선택으로',
  },
} as const;
