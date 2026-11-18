import type { CSSProperties } from 'react';
import { useSyncExternalStore } from 'react';

export type BubbleDateState = {
	date: string;
	show: boolean;
	style?: CSSProperties;
	showDivider: boolean;
};

/**
 * The floating date of a message list. Scrolling updates it many times per second, so it lives outside React state:
 * `useDateScroll` writes it, the bubble reads it with `useBubbleDate`, and `BubbleDateScope` reads only the day divider
 * it hides with `useHiddenDayDivider`, so the list and the room body do not re-render while scrolling.
 */
export type BubbleDateStore = {
	get: () => BubbleDateState;
	subscribe: (onChange: () => void) => () => void;
	set: (update: (current: BubbleDateState) => BubbleDateState) => void;
};

export const initialBubbleDateState: BubbleDateState = { date: '', show: false, style: undefined, showDivider: true };

const isSameStyle = (a: CSSProperties | undefined, b: CSSProperties | undefined) => {
	if (a === b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}
	const keys = Object.keys(a) as (keyof CSSProperties)[];
	return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
};

const isSameState = (a: BubbleDateState, b: BubbleDateState) =>
	a.date === b.date && a.show === b.show && a.showDivider === b.showDivider && isSameStyle(a.style, b.style);

export const createBubbleDateStore = (): BubbleDateStore => {
	let state = initialBubbleDateState;
	const listeners = new Set<() => void>();

	return {
		get: () => state,
		subscribe: (onChange) => {
			listeners.add(onChange);
			return () => listeners.delete(onChange);
		},
		set: (update) => {
			const next = update(state);
			if (isSameState(state, next)) {
				return;
			}
			state = next;
			listeners.forEach((onChange) => onChange());
		},
	};
};

export const useBubbleDate = (store: BubbleDateStore): BubbleDateState => useSyncExternalStore(store.subscribe, store.get);

/** The day (`YYYYMMDD`, as in a divider's `data-time`) whose divider the bubble stands in for, if any. */
export const useHiddenDayDivider = (store: BubbleDateStore): string | undefined =>
	useSyncExternalStore(store.subscribe, () => {
		const { date, show, showDivider } = store.get();
		return show && date && !showDivider ? date.replaceAll(/[-T:.]/g, '').substring(0, 8) : undefined;
	});
