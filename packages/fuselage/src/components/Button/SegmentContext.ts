import { createContext } from 'react';

export type SegmentPosition = 'only' | 'first' | 'middle' | 'last';

export type SegmentTone = 'default' | 'danger' | 'warning' | 'success' | 'primary';

export type Segment = {
	position: SegmentPosition;
	tone: SegmentTone;
	/** The segment shows the group's background through it, as the trigger of a `SplitButton` does. */
	ghost: boolean;
};

/** What a `SplitButton` tells the buttons it holds: where they sit in the group, and the group's tone. */
export const SegmentContext = createContext<Segment | undefined>(undefined);

const known = new Map<string, Segment>();

/** One value per position, tone and kind, so the buttons that read it do not re-render when their group does. */
export const segmentValue = (position: SegmentPosition, tone: SegmentTone, ghost: boolean): Segment => {
	const key = `${position}|${tone}|${ghost}`;
	let segment = known.get(key);
	if (!segment) {
		segment = { position, tone, ghost };
		known.set(key, segment);
	}
	return segment;
};
