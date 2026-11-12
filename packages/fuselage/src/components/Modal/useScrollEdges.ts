import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { UIEvent } from 'react';
import { useRef } from 'react';

type Edges = { top: boolean; bottom: boolean; left: boolean; right: boolean };

const touchingEdges = (element: Element): Edges => ({
	top: !element.scrollTop,
	bottom: !(element.scrollTop + element.clientHeight - element.scrollHeight),
	left: !element.scrollLeft,
	right: !(element.scrollLeft + element.clientWidth - element.scrollWidth),
});

/**
 * Reports the edges a scrolling element touches once a scroll starts and again 200ms after it stops, only when they changed.
 * Returns the `onScroll` handler to put on the element, or `undefined` when nobody listens.
 */
export const useScrollEdges = (onScrollContent: ((edges: Edges) => void) | undefined) => {
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const lastEdgesRef = useRef<Partial<Edges>>({});

	const poll = (element: Element) => {
		const edges = touchingEdges(element);
		const last = lastEdgesRef.current;

		if (last.top !== edges.top || last.bottom !== edges.bottom || last.left !== edges.left || last.right !== edges.right) {
			lastEdgesRef.current = edges;
			onScrollContent?.(edges);
		}
	};

	const handleScroll = useStableCallback((event: UIEvent<Element>) => {
		const element = event.currentTarget;

		if (!timeoutRef.current) {
			poll(element);
		}

		clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = undefined;
			poll(element);
		}, 200);
	});

	return onScrollContent ? handleScroll : undefined;
};
