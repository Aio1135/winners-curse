import type { BidderSpec } from '../engine/types';
import { createBulldozer } from './bulldozer';
import { createHonest } from './honest';
import { createMiser } from './miser';
import type { Bidder } from './types';

export function createBidder(spec: BidderSpec): Bidder {
  switch (spec.kind) {
    case 'honest':
      return createHonest(spec.id, spec.name);
    case 'bulldozer':
      return createBulldozer(spec.id, spec.name);
    case 'miser':
      return createMiser(spec.id, spec.name);
    default:
      // TODO(D5): sniper, cartel
      throw new Error(`${spec.kind} 성격은 아직 구현되지 않았다`);
  }
}
