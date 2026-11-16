export type DateBubbleState = {
	date: Date | undefined;
	isVisible: boolean;
	/** How far the next day's divider pushes the floating date up, in pixels. */
	offset: number;
};

/**
 * The floating date of a list. Every scroll updates it, so it lives outside React state: the list writes it, and only the
 * floating date reads it, so no row draws again while the viewer scrolls.
 */
export type DateBubbleStore = {
	get: () => DateBubbleState;
	subscribe: (onChange: () => void) => () => void;
	set: (next: DateBubbleState) => void;
};

const initialState: DateBubbleState = { date: undefined, isVisible: false, offset: 0 };

export const createDateBubbleStore = (): DateBubbleStore => {
	let state = initialState;
	const listeners = new Set<() => void>();

	return {
		get: () => state,
		subscribe: (onChange) => {
			listeners.add(onChange);
			return () => listeners.delete(onChange);
		},
		set: (next) => {
			if (next.date?.getTime() === state.date?.getTime() && next.isVisible === state.isVisible && next.offset === state.offset) {
				return;
			}
			state = next.date?.getTime() === state.date?.getTime() ? { ...next, date: state.date } : next;
			listeners.forEach((onChange) => onChange());
		},
	};
};
