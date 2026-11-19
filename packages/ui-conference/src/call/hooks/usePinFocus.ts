import type { RefCallback } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

type PinFocusScope = { request: (key: string) => void; isRequested: (key: string) => boolean };

const PinFocusContext = createContext<PinFocusScope | null>(null);

export const PinFocusProvider = PinFocusContext.Provider;

/**
 * Lets the focus follow a pin control that toggling draws somewhere else, or land on the element holding the returned
 * ref when it is drawn nowhere. A request lasts one render, so a control drawn later never steals the focus.
 */
export const usePinFocusScope = (): [scope: PinFocusScope, fallbackRef: RefCallback<HTMLElement>] => {
	const requested = useRef<string | null>(null);
	const fallback = useRef<HTMLElement | null>(null);

	useEffect(() => {
		const node = fallback.current;
		if (requested.current !== null && node && node.ownerDocument.activeElement === node.ownerDocument.body) {
			node.focus();
		}
		requested.current = null;
	});

	const scope = useMemo(
		(): PinFocusScope => ({
			request: (key) => {
				requested.current = key;
			},
			isRequested: (key) => requested.current === key,
		}),
		[],
	);

	const fallbackRef = useCallback((node: HTMLElement | null) => {
		fallback.current = node;
	}, []);

	return [scope, fallbackRef];
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
