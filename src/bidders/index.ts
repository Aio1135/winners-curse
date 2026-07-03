import type { BidderSpec } from '../engine/types';
import { createBulldozer } from './bulldozer';
import { createCartel } from './cartel';
import { createHonest } from './honest';
import { createMiser } from './miser';
import { createSniper } from './sniper';
import type { Bidder } from './types';

export function createBidder(spec: BidderSpec): Bidder {
  switch (spec.kind) {
    case 'honest':
      return createHonest(spec);
    case 'bulldozer':
      return createBulldozer(spec);
    case 'miser':
      return createMiser(spec);
    case 'sniper':
      return createSniper(spec);
    case 'cartel':
      return createCartel(spec);
  }
}
