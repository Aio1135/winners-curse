// 한국어 UI 텍스트는 전부 이 파일에 모은다.

export const TEXT = {
  app: {
    title: '낙찰王',
    subtitle: 'AI 입찰자를 상대로 경매 이론을 공략하는 전략 퍼즐',
  },
  stageSelect: {
    heading: '스테이지 선택',
    stageLabel: (id: number) => `스테이지 ${id}`,
    locked: '잠김',
  },
  briefing: {
    heading: '브리핑',
    start: '경매 시작',
    back: '스테이지 선택으로',
    placeholder: '경매 방식·예산·클리어 조건·AI 소개가 여기에 표시됩니다.',
  },
  auctionRoom: {
    round: (current: number, total: number) => `라운드 ${current} / ${total}`,
    budget: '예산',
    coins: '감정 코인',
    confirmItem: '입찰 준비',
    requestAppraisal: '감정 의뢰 (코인 1)',
    pass: '이번 라운드 패스',
    enterBidding: '입찰 참여',
    placeBid: '입찰 제출',
    drop: '포기',
    openReview: '복기 보기',
    nextRound: '다음 라운드',
    toResult: '결과 보기',
    exit: '스테이지 나가기',
  },
  phase: {
    ROUND_INTRO: '아이템 공개',
    JUDGEMENT: '판단의 시간',
    BIDDING: '입찰 중',
    SETTLE: '낙찰 정산',
    REVIEW: '복기',
    RESULT: '최종 결과',
  },
} as const;

/** 금액 표기: 정수 + 천 단위 콤마 */
export function formatMoney(amount: number): string {
  return amount.toLocaleString('ko-KR');
}
