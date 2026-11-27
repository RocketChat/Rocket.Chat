import { useMemo } from 'react';

export type DraftStorage = {
	get: () => string | null;
	/** An empty or missing value removes the stored draft. */
	set: (value?: string) => void;
};

/**
 * Synchronous storage for the unsent text under `storageKey`, so the first render can read it.
 */
export const useDraftStorage = (storageKey: string): DraftStorage =>
	useMemo(
		() => ({
			get: () => localStorage.getItem(storageKey),
			set: (value) => {
				if (value) {
					localStorage.setItem(storageKey, value);
				} else {
					localStorage.removeItem(storageKey);
				}
			},
		}),
		[storageKey],
	);
