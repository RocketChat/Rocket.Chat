import { css } from '@rocket.chat/css-in-js';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { PropsWithChildren, MouseEvent, RefObject } from 'react';
import { useRef, useCallback } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { useStyle } from '../../hooks/useStyle';
import { BoxTransforms, useComposedBoxTransform } from '../Box/BoxTransforms';

export type ScrollableProps = PropsWithChildren<{
	horizontal?: boolean;
	vertical?: boolean;
	smooth?: boolean;
	onScrollContent?: (touching: { top: boolean }) => void;
}>;

const getTouchingEdges = (element: Element) => ({
	top: !element.scrollTop,
	bottom: !(element.scrollTop + element.clientHeight - element.scrollHeight),
	left: !element.scrollLeft,
	right: !(element.scrollLeft + element.clientWidth - element.scrollWidth),
});

const pollTouchingEdges = (
	element: EventTarget & Element,
	touchingEdgesRef: RefObject<Record<string, boolean>>,
	onScrollContent: ((touching: { top: boolean }) => void) | undefined,
) => {
	const touchingEdges = touchingEdgesRef.current;
	const newTouchingEdges = getTouchingEdges(element);

	const dirty =
		touchingEdges &&
		(touchingEdges.top !== newTouchingEdges.top ||
			touchingEdges.bottom !== newTouchingEdges.bottom ||
			touchingEdges.left !== newTouchingEdges.left ||
			touchingEdges.right !== newTouchingEdges.right);

	if (dirty) {
		touchingEdgesRef.current = newTouchingEdges;
		onScrollContent?.(newTouchingEdges);
	}
};

/**
 * Add scroll capability to the wrapped component.
 */
const Scrollable = ({ children, horizontal, vertical, smooth, onScrollContent }: ScrollableProps) => {
	const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const touchingEdgesRef = useRef({});

	const handleScroll = useStableCallback((event: MouseEvent) => {
		const element = event.currentTarget;

		if (!scrollTimeoutRef.current) {
			pollTouchingEdges(element, touchingEdgesRef, onScrollContent);
		}

		if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

		scrollTimeoutRef.current = setTimeout(() => {
			scrollTimeoutRef.current = undefined;
			pollTouchingEdges(element, touchingEdgesRef, onScrollContent);
		}, 200);
	});

	const className = useStyle(
		css`
			position: relative;

			&::-webkit-scrollbar {
				width: ${4 / 16}rem;
				height: ${4 / 16}rem;
			}

			&::-webkit-scrollbar-track {
				background-color: transparent;
			}

			&::-webkit-scrollbar-thumb {
				background-color: rgba(0, 0, 0, 0.05);
				background-color: var(--rcx-theme-scrollbar-thumb-color, rgba(0, 0, 0, 0.05));
			}

			&:hover::-webkit-scrollbar-thumb {
				background-color: rgba(0, 0, 0, 0.15);
				background-color: var(--rcx-theme-scrollbar-thumb-hover-color, rgba(0, 0, 0, 0.15));
			}

			${
				(horizontal &&
					css`
						overflow-x: auto !important;
					`) ||
				(vertical &&
					css`
						overflow-y: auto !important;
					`) ||
				css`
					overflow: auto !important;
				`
			}
			${
				smooth &&
				css`
					scroll-behavior: smooth !important;
				`
			}
		`,
		null,
	);

	const transformFn = useCallback(
		(props: any) => {
			props.className = className && appendClassName(props.className, className);

			if (onScrollContent !== undefined && props.onScroll === undefined) {
				props.onScroll = handleScroll;
			}

			return props;
		},
		[className, handleScroll, onScrollContent],
	);

	return <BoxTransforms.Provider value={useComposedBoxTransform(transformFn)}>{children}</BoxTransforms.Provider>;
};

export default Scrollable;
