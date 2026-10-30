import type { PlacementVariant } from './PlacementVariant.js';
import type { Position } from './Position.js';

export type Placement = `${Position}-${PlacementVariant}` | Position;
