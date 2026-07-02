import { DUTCH_STEP } from './auction';
import type { AuctionType, RoundRecord } from './types';

/** 복기 화면에 표시할 참가자 정보 (감정치는 여기서 처음 공개된다) */
export interface ReviewParticipantInput {
  id: string;
  name: string;
  emoji: string;
  appraisal: number;
  /** AI의 복기 대사. 플레이어는 null */
  line: string | null;
}

export interface ReviewEntry extends ReviewParticipantInput {
  bid: number;
  isWinner: boolean;
}

export interface ReviewData {
  auctionType: AuctionType;
  itemValue: number;
  winnerId: string | null;
  price: number;
  entries: ReviewEntry[];
  /** 판별 피드백 문구 */
  feedback: string[];
}

const fmt = (n: number) => n.toLocaleString('ko-KR');

/** Vickrey 검증: 감정치와 다르게 불렀으면 정직 입찰 대비 손익 차이를 계산한다 */
function vickreyFeedback(
  record: RoundRecord,
  playerId: string,
  appraisal: number,
  playerBid: number,
): string | null {
  if (record.auctionType !== 'sealed-second' || playerBid <= 0) return null;
  if (playerBid === appraisal) {
    return `감정치 ${fmt(appraisal)} 그대로 정직하게 불렀다 — 2가 경매의 (약)우월전략이다.`;
  }
  const othersMax = Math.max(
    ...record.bids.filter((b) => b.id !== playerId).map((b) => b.bid),
    0,
  );
  const V = record.itemValue;
  const actualProfit = record.winnerId === playerId ? V - record.price : 0;
  const honestWins = appraisal > othersMax;
  const honestProfit = honestWins ? V - othersMax : 0;
  const delta = honestProfit - actualProfit;
  const direction = playerBid < appraisal ? '낮춰' : '올려';
  if (delta > 0) {
    return `감정치 ${fmt(appraisal)} 그대로 불렀다면 손익 ${fmt(honestProfit)} — 실제(${fmt(actualProfit)})보다 ${fmt(delta)} 이득이었다. 2가 경매에선 ${direction} 불러도 좋을 게 없다.`;
  }
  if (delta < 0) {
    return `이번엔 ${direction} 부른 게 결과적으로 ${fmt(-delta)} 이득이었다 (정직 입찰이면 ${fmt(honestProfit)}). 하지만 그건 감정치가 빗나간 운 — 입찰 시점엔 알 수 없다.`;
  }
  return `감정치(${fmt(appraisal)})와 다르게 ${fmt(playerBid)}을 불렀지만 결과는 같았다. 2가 경매에선 감정치 그대로가 (약)우월전략이다.`;
}

/** 네덜란드식 낙찰 검증: 몇 틱 더 기다릴 수 있었는지 계산한다 */
function dutchFeedback(record: RoundRecord, playerId: string): string | null {
  if (record.auctionType !== 'dutch' || record.winnerId !== playerId) return null;
  const maxTarget = Math.max(
    ...record.bids.filter((b) => b.id !== playerId).map((b) => b.bid),
    0,
  );
  if (maxTarget <= 0) {
    return 'AI 중 이 물건을 노리는 이가 없었다 — 하한 근처까지 기다려도 안전했다.';
  }
  // AI 목표가 위에 머무는 동안만 안전하게 기다릴 수 있다
  let price = record.price;
  let ticks = 0;
  while (Math.floor(price * (1 - DUTCH_STEP)) > maxTarget) {
    price = Math.floor(price * (1 - DUTCH_STEP));
    ticks += 1;
  }
  if (ticks > 0) {
    return `${ticks}틱 더 기다렸으면 ${fmt(record.price - price)} 절약할 수 있었다 (단, AI 목표가 최고는 ${fmt(maxTarget)} — 그 밑으론 뺏겼다).`;
  }
  return `거의 한계까지 기다렸다 — AI 목표가 최고 ${fmt(maxTarget)} 직전에 잘 낚아챘다.`;
}

/** 승자의 저주 발생 시 감정치 분포와 V의 관계를 한 줄로 설명한다 */
function curseFeedback(
  record: RoundRecord,
  participants: ReviewParticipantInput[],
): string | null {
  if (!record.winnersCurse) return null;
  const appraisals = participants.map((p) => p.appraisal);
  const avg = Math.round(appraisals.reduce((s, a) => s + a, 0) / appraisals.length);
  return `승자의 저주: 진짜 가치 ${fmt(record.itemValue)} < 낙찰가 ${fmt(record.price)}. 가장 후하게 평가한 사람이 이기기 마련이라, 이겼다는 사실 자체가 과대평가 신호다 (전원 감정치 평균 ${fmt(avg)}).`;
}

/** 패스(불참)한 라운드: 참여했다면 어땠을지 요약 1줄 */
function passFeedback(
  record: RoundRecord,
  playerId: string,
  appraisal: number,
  playerBid: number,
): string | null {
  if (playerBid > 0 || record.winnerId === playerId) return null;
  if (record.winnerId === null) {
    return '패스했고 유찰됐다 — 아무도 값을 부르지 않은 물건이었다.';
  }
  const V = record.itemValue;
  if (V > record.price) {
    return `참여했다면: 낙찰가 ${fmt(record.price)} < 진짜 가치 ${fmt(V)} — ${fmt(V - record.price)}짜리 기회를 놓쳤다 (내 감정치는 ${fmt(appraisal)}이었다).`;
  }
  return `참여 안 하길 잘했다: 낙찰가 ${fmt(record.price)} ≥ 진짜 가치 ${fmt(V)} — 낙찰자가 ${fmt(record.price - V)} 손해 봤다.`;
}

/** 판별 피드백 (§8.3) — 전부 순수 함수, 하드코딩 문자열 + 수치 삽입 */
function buildFeedback(
  record: RoundRecord,
  participants: ReviewParticipantInput[],
  playerId: string,
): string[] {
  const player = participants.find((p) => p.id === playerId);
  if (player === undefined) return [];
  const playerBid = record.bids.find((b) => b.id === playerId)?.bid ?? 0;
  return [
    vickreyFeedback(record, playerId, player.appraisal, playerBid),
    dutchFeedback(record, playerId),
    curseFeedback(record, participants),
    passFeedback(record, playerId, player.appraisal, playerBid),
  ].filter((line): line is string => line !== null);
}

/** 복기 데이터 생성: 전원의 감정치·입찰액·대사 공개 + 판별 피드백 */
export function buildReview(
  record: RoundRecord,
  participants: ReviewParticipantInput[],
  playerId: string,
): ReviewData {
  const bidOf = new Map(record.bids.map((b) => [b.id, b.bid]));
  return {
    auctionType: record.auctionType,
    itemValue: record.itemValue,
    winnerId: record.winnerId,
    price: record.price,
    entries: participants.map((p) => ({
      ...p,
      bid: bidOf.get(p.id) ?? 0,
      isWinner: p.id === record.winnerId,
    })),
    feedback: buildFeedback(record, participants, playerId),
  };
}
