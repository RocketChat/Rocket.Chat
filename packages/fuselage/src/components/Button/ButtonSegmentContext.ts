import { createContext } from 'react';

import type { GhostKind } from './buttonColors';

export type ButtonSegment = {
	position: 'first' | 'middle' | 'last' | 'only';
	variant: GhostKind;
	ghost?: boolean;
};

/** Where a button sits among the fused segments of a `SplitButton`, and whether it is the group's ghost segment. */
export const ButtonSegmentContext = createContext<ButtonSegment | undefined>(undefined);
