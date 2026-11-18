import { usePosition } from '.';
import { withResizeObserverMock } from '../../mocks/withResizeObserverMock';
import { act, renderHook } from '../testing';

withResizeObserverMock();

const createRect = (left: number, top: number, width: number, height: number) =>
	({ x: left, y: top, left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;

let anchor: HTMLElement;
let target: HTMLElement;
let anchorRect: DOMRect;

beforeEach(() => {
	jest.useFakeTimers();

	anchor = document.createElement('button');
	target = document.createElement('div');
	document.body.append(anchor, target);

	anchorRect = createRect(100, 200, 160, 40);
	jest.spyOn(anchor, 'getBoundingClientRect').mockImplementation(() => anchorRect);
	jest.spyOn(target, 'getBoundingClientRect').mockImplementation(() => createRect(0, 0, 160, 120));
});

afterEach(() => {
	anchor.remove();
	target.remove();
	jest.useRealTimers();
});

const renderPosition = () => {
	const anchorRef = { current: anchor };
	const targetRef = { current: target };

	return renderHook(() => usePosition(anchorRef, targetRef, { margin: 4, placement: 'bottom-start' }));
};

const scrollBy = (scrolled: EventTarget, distance: number) => {
	anchorRect = createRect(anchorRect.left, anchorRect.top - distance, anchorRect.width, anchorRect.height);

	act(() => {
		scrolled.dispatchEvent(new Event('scroll'));
		jest.advanceTimersByTime(16);
	});
};

it('follows the anchor when the page scrolls', () => {
	const { result } = renderPosition();

	scrollBy(document, 50);

	expect(result.current.style).toMatchObject({ top: 194, left: 100 });
});

it('follows the anchor when one of its scroll containers scrolls', () => {
	const scrollContainer = document.createElement('div');
	document.body.append(scrollContainer);
	scrollContainer.append(anchor);
	const { result } = renderPosition();

	scrollBy(scrollContainer, 30);

	expect(result.current.style).toMatchObject({ top: 214, left: 100 });
	scrollContainer.remove();
});

it('measures the target at its own size, not at the size its fallback placement limits it to', () => {
	jest.spyOn(target, 'getBoundingClientRect').mockImplementation(() => createRect(0, 0, 160, target.style.bottom ? 50 : 600));
	target.style.bottom = '8px';
	const { result } = renderPosition();

	act(() => {
		jest.advanceTimersByTime(16);
	});

	expect(result.current.style).toMatchObject({ top: 84 });
	expect(target.style.bottom).toBe('8px');
});

it('measures the target at its own width, not at the width a viewport edge wraps it to', () => {
	jest.spyOn(target, 'getBoundingClientRect').mockImplementation(() => createRect(0, 0, target.style.left === '0px' ? 120 : 60, 40));
	anchorRect = createRect(window.innerWidth - 120, 200, 40, 40);
	target.style.left = `${window.innerWidth - 76}px`;
	const anchorRef = { current: anchor };
	const targetRef = { current: target };
	const { result } = renderHook(() => usePosition(anchorRef, targetRef, { margin: 4, placement: 'right-middle' }));

	act(() => {
		jest.advanceTimersByTime(16);
	});

	expect(result.current.placement).toBe('left-middle');
	expect(target.style.left).toBe(`${window.innerWidth - 76}px`);
});

it('keeps the target in place once its anchor leaves the page', () => {
	const { result } = renderPosition();

	scrollBy(document, 0);
	expect(result.current.style).toMatchObject({ top: 244, left: 100 });

	anchor.remove();
	anchorRect = createRect(0, 0, 0, 0);
	scrollBy(document, 0);

	expect(result.current.style).toMatchObject({ top: 244, left: 100 });
});
