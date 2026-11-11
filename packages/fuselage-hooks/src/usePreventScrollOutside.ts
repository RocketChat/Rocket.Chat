import type { RefObject } from 'react';
import { useEffect } from 'react';

type Axis = 'x' | 'y';

// The axis a gesture mostly moves along; a diagonal trackpad scroll counts as the larger of its two parts.
const getDominantAxis = (deltaX: number, deltaY: number): [Axis, number] =>
	Math.abs(deltaX) > Math.abs(deltaY) ? ['x', deltaX] : ['y', deltaY];

const canScrollWithin = (from: Element, boundary: Element, axis: Axis, delta: number) => {
	for (let element: Element | null = from; element; element = element.parentElement) {
		const style = element.ownerDocument.defaultView?.getComputedStyle(element);
		const overflow = axis === 'y' ? style?.overflowY : style?.overflowX;
		const [position, size, viewport] =
			axis === 'y'
				? [element.scrollTop, element.scrollHeight, element.clientHeight]
				: [element.scrollLeft, element.scrollWidth, element.clientWidth];

		const isScrollable = (overflow === 'auto' || overflow === 'scroll') && size > viewport;

		if (isScrollable && (delta < 0 ? position > 0 : position + viewport < size)) {
			return true;
		}

		if (element === boundary) {
			return false;
		}
	}

	return false;
};

/**
 * Hook that holds the page still while an element is shown, so the element cannot drift away from what it is anchored to.
 *
 * Wheel and touch scrolling outside the element are cancelled; inside it, they only scroll what can still scroll there in
 * their direction, and never carry over to the page.
 *
 * @param targetRef - the element that keeps scrolling
 * @param enabled - whether the page is held still
 * @public
 */
export const usePreventScrollOutside = (targetRef: RefObject<Element | null>, enabled = true): void => {
	useEffect(() => {
		const view = targetRef.current?.ownerDocument.defaultView ?? window;

		if (!enabled) {
			return;
		}

		const allowsScroll = (event: Event, deltaX: number, deltaY: number) => {
			const target = targetRef.current;

			if (!target) {
				return true;
			}

			if (!(event.target instanceof view.Node) || !target.contains(event.target)) {
				return false;
			}

			const [axis, delta] = getDominantAxis(deltaX, deltaY);

			return canScrollWithin(event.target as Element, target, axis, delta);
		};

		const handleWheel = (event: WheelEvent) => {
			if (!allowsScroll(event, event.deltaX, event.deltaY)) {
				event.preventDefault();
			}
		};

		let lastTouch: { x: number; y: number } | undefined;

		const handleTouchStart = (event: TouchEvent) => {
			const [touch] = event.touches;
			lastTouch = touch && { x: touch.clientX, y: touch.clientY };
		};

		const handleTouchMove = (event: TouchEvent) => {
			const [touch] = event.touches;

			if (!touch) {
				return;
			}

			const previous = lastTouch ?? { x: touch.clientX, y: touch.clientY };
			lastTouch = { x: touch.clientX, y: touch.clientY };

			// A finger moving up scrolls the content down, the opposite of its own movement.
			if (!allowsScroll(event, previous.x - touch.clientX, previous.y - touch.clientY)) {
				event.preventDefault();
			}
		};

		view.addEventListener('wheel', handleWheel, { capture: true, passive: false });
		view.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
		view.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });

		return () => {
			view.removeEventListener('wheel', handleWheel, { capture: true });
			view.removeEventListener('touchstart', handleTouchStart, { capture: true });
			view.removeEventListener('touchmove', handleTouchMove, { capture: true });
		};
	}, [targetRef, enabled]);
};
