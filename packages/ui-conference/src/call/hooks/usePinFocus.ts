import type { RefCallback } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

type PinFocusScope = { request: (key: string) => void; isRequested: (key: string) => boolean };

const PinFocusContext = createContext<PinFocusScope | null>(null);

export const PinFocusProvider = PinFocusContext.Provider;

/**
 * Lets the focus follow a pin control that toggling draws somewhere else. A request lasts one render, so a control
 * drawn later never steals the focus.
 */
export const usePinFocusScope = (): PinFocusScope => {
	const requested = useRef<string | null>(null);

	useEffect(() => {
		requested.current = null;
	});

	return useMemo(
		() => ({
			request: (key) => {
				requested.current = key;
			},
			isRequested: (key) => requested.current === key,
		}),
		[],
	);
};

/** For the pin control named `key`: a ref that takes a requested focus, and what to call when it is toggled. */
export const usePinFocus = (key: string): [ref: RefCallback<HTMLElement>, keepFocus: (control: HTMLElement) => void] => {
	const scope = useContext(PinFocusContext);

	const ref = useCallback(
		(node: HTMLElement | null) => {
			if (node && scope?.isRequested(key)) {
				node.focus();
			}
		},
		[scope, key],
	);

	const keepFocus = useCallback(
		(control: HTMLElement) => {
			if (control === control.ownerDocument.activeElement) {
				scope?.request(key);
			}
		},
		[scope, key],
	);

	return [ref, keepFocus];
};
