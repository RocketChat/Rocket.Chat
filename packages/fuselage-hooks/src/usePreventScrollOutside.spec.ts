import { renderHook } from './testing';
import { usePreventScrollOutside } from './usePreventScrollOutside';

let target: HTMLElement;
let list: HTMLElement;
let outside: HTMLElement;

type ScrollState = {
	scrollTop?: number;
	scrollHeight?: number;
	clientHeight?: number;
	scrollLeft?: number;
	scrollWidth?: number;
	clientWidth?: number;
};

const setScrollState = (element: HTMLElement, state: ScrollState) => {
	if (state.scrollHeight !== undefined) {
		element.style.overflowY = 'auto';
	}

	if (state.scrollWidth !== undefined) {
		element.style.overflowX = 'auto';
	}

	(['scrollHeight', 'clientHeight', 'scrollWidth', 'clientWidth'] as const).forEach((key) => {
		if (state[key] !== undefined) {
			Object.defineProperty(element, key, { configurable: true, value: state[key] });
		}
	});

	element.scrollTop = state.scrollTop ?? 0;
	element.scrollLeft = state.scrollLeft ?? 0;
};

const dispatchWheel = (element: Element, deltaY: number, deltaX = 0) => {
	const event = new WheelEvent('wheel', { deltaX, deltaY, bubbles: true, cancelable: true });
	element.dispatchEvent(event);
	return event.defaultPrevented;
};

const dispatchTouch = (element: Element, type: 'touchstart' | 'touchmove', clientY: number) => {
	const event = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperty(event, 'touches', { value: [{ clientX: 0, clientY }] });
	element.dispatchEvent(event);
	return event.defaultPrevented;
};

// Moves a finger up, which scrolls content down, the way a swipe through a list does.
const swipeUp = (element: Element) => {
	dispatchTouch(element, 'touchstart', 200);
	return dispatchTouch(element, 'touchmove', 150);
};

beforeEach(() => {
	target = document.createElement('div');
	list = document.createElement('ul');
	outside = document.createElement('div');
	target.append(list);
	document.body.append(target, outside);
});

afterEach(() => {
	target.remove();
	outside.remove();
});

const render = (enabled?: boolean, targetRef: { current: Element | null } = { current: target }) =>
	renderHook(() => usePreventScrollOutside(targetRef, enabled));

it('cancels wheel and touch scrolling outside the target', () => {
	render();

	expect(dispatchWheel(outside, 100)).toBe(true);
	expect(swipeUp(outside)).toBe(true);
});

it('lets a wheel scroll what can still scroll inside the target, and stops it at the end', () => {
	setScrollState(list, { scrollTop: 50, scrollHeight: 400, clientHeight: 200 });
	render();

	expect(dispatchWheel(list, 100)).toBe(false);

	setScrollState(list, { scrollTop: 200, scrollHeight: 400, clientHeight: 200 });

	expect(dispatchWheel(list, 100)).toBe(true);
	expect(dispatchWheel(list, -100)).toBe(false);
});

it('lets a swipe scroll what can still scroll inside the target, and stops it at the end', () => {
	setScrollState(list, { scrollTop: 50, scrollHeight: 400, clientHeight: 200 });
	render();

	expect(swipeUp(list)).toBe(false);

	setScrollState(list, { scrollTop: 200, scrollHeight: 400, clientHeight: 200 });

	expect(swipeUp(list)).toBe(true);
});

it('leaves scrolling alone when disabled, and once unmounted', () => {
	render(false);

	expect(dispatchWheel(outside, 100)).toBe(false);

	const { unmount } = render();
	unmount();

	expect(dispatchWheel(outside, 100)).toBe(false);
	expect(swipeUp(outside)).toBe(false);
});
