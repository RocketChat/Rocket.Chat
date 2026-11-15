import type { PlacementVariant } from './PlacementVariant';
import type { Position } from './Position';

export type Placement = `${Position}-${PlacementVariant}` | Position;
