import { getPositionStyle , usePosition} from '.';
import { getTargetBoundaries } from './getTargetBoundaries';
import { getVariantBoundaries } from './getVariantBoundaries';
import { withResizeObserverMock } from '../../mocks/withResizeObserverMock';
import { createElement, useRef } from 'react';
import { render } from '@testing-library/react';
import { act, renderHook } from '../testing';

withResizeObserverMock();
describe('usePosition', () => {
	it('should initially return a hidden style', () => {
		const { result } = renderHook(() => {
			const anchorRef = useRef<HTMLButtonElement>(null);
			const targetRef = useRef<HTMLDivElement>(null);

			return usePosition(anchorRef, targetRef);
		});

		expect(result.current.style).toEqual({
			position: 'fixed',
			visibility: 'hidden',
		});
	});

	it('should calculate the target position after mounting', () => {
		jest.useFakeTimers();

		const rect = (x: number, y: number, width: number, height: number) =>
			({
				x,
				y,
				width,
				height,
				top: y,
				right: x + width,
				bottom: y + height,
				left: x,
				toJSON: () => ({}),
			}) as DOMRect;

		const anchorRect = rect(100, 100, 80, 30);
		const targetRect = rect(0, 0, 100, 40);
		const containerRect = rect(0, 0, 1024, 768);

		const getBoundingClientRect = jest
			.spyOn(HTMLElement.prototype, 'getBoundingClientRect')
			.mockImplementation(function (this: HTMLElement) {
				if (this.id === 'anchor') {
					return anchorRect;
				}

				if (this.id === 'target' || this.id === 'clone') {
					return targetRect;
				}

				if (this === document.body) {
					return containerRect;
				}

				return rect(0, 0, 0, 0);
			});

		let currentStyle: ReturnType<typeof usePosition> | undefined;

		const TestComponent = () => {
			const anchorRef = useRef<HTMLButtonElement>(null);
			const targetRef = useRef<HTMLDivElement>(null);

			currentStyle = usePosition(anchorRef, targetRef);

			return createElement(
				'div',
				null,
				createElement('button', { id: 'anchor', ref: anchorRef }),
				createElement('div', {
					id: 'target',
					ref: targetRef,
					style: currentStyle.style,
				}),
			);
		};

		try {
			const view = render(createElement(TestComponent));

			act(() => {
				jest.advanceTimersByTime(50);
			});

			expect(currentStyle?.style.top).toBe(138);
			expect(currentStyle?.style.left).toBe(100);
			expect(currentStyle?.placement).toBe('bottom-start');

			view.unmount();
		} finally {
			getBoundingClientRect.mockRestore();
			jest.useRealTimers();
		}
	});
});

describe('getPositionStyle function', () => {
	const createRect = (x: number, y: number, width: number, height: number) =>
		({
			x,
			y,
			width,
			height,
			top: y,
			right: x + width,
			bottom: y + height,
			left: x,
		}) as DOMRect;

	it('returns a style for placement bottom-start', () => {
		const containerRect = createRect(0, 0, 1024, 1000);
		const anchorRect = createRect(0, 200, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'bottom-start';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(0);
		expect(result.style.top).toEqual(300);
	});

	it('returns a style for placement bottom-start if the element height does not fit', () => {
		const containerRect = createRect(0, 0, 1024, 300);
		const anchorRect = createRect(0, 200, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'bottom-start';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(0);
		expect(result.style.top).toEqual(150);
	});

	it('returns a style for placement bottom-middle', () => {
		const containerRect = createRect(0, 0, 1024, 1000);
		const anchorRect = createRect(0, 200, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'bottom-middle';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(25);
		expect(result.style.top).toEqual(300);
	});

	it('returns a style for placement bottom-middle if the element height does not fit', () => {
		const containerRect = createRect(0, 0, 1024, 300);
		const anchorRect = createRect(0, 200, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'bottom-middle';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(25);
		expect(result.style.top).toEqual(150);
	});

	it('returns a style for placement bottom-end', () => {
		const containerRect = createRect(0, 0, 1024, 1000);
		const anchorRect = createRect(0, 200, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'bottom-end';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(50);
		expect(result.style.top).toEqual(300);
	});

	it('returns a style for placement bottom-end if the element height does not fit', () => {
		const containerRect = createRect(0, 0, 1024, 300);
		const anchorRect = createRect(0, 200, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'bottom-end';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(50);
		expect(result.style.top).toEqual(150);
	});

	it('returns a style for placement top-start', () => {
		const containerRect = createRect(0, 0, 1024, 1000);
		const anchorRect = createRect(0, 200, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'top-start';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(0);
		expect(result.style.top).toEqual(150);
	});

	it('returns a style for placement top-start if the element height does not fit', () => {
		const containerRect = createRect(0, 0, 1024, 1000);
		const anchorRect = createRect(0, 10, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'top-start';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(0);
		expect(result.style.top).toEqual(110);
	});

	it('returns a style for placement top-middle', () => {
		const containerRect = createRect(0, 0, 1024, 1000);
		const anchorRect = createRect(0, 200, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'top-middle';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(25);
		expect(result.style.top).toEqual(150);
	});

	it('returns a style for placement top-middle if the element height does not fit', () => {
		const containerRect = createRect(0, 0, 1024, 1000);
		const anchorRect = createRect(0, 10, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'top-middle';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(25);
		expect(result.style.top).toEqual(110);
	});

	it('returns a style for placement top-end', () => {
		const containerRect = createRect(0, 0, 1024, 1000);
		const anchorRect = createRect(0, 200, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'top-end';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(50);
		expect(result.style.top).toEqual(150);
	});

	it('returns a style for placement top-end if the element height does not fit', () => {
		const containerRect = createRect(0, 0, 1024, 1000);
		const anchorRect = createRect(0, 10, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'top-end';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(50);
		expect(result.style.top).toEqual(110);
	});

	it('returns a style for placement bottom-end if the element height does not fit container height aligning vertically middle of container', () => {
		const containerRect = createRect(0, 0, 1024, 80);
		const anchorRect = createRect(0, 200, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'bottom-end';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual(undefined);
		expect(result.style.left).toEqual(50);
		expect(result.style.top).toEqual(15);
	});

	it('returns a style for placement bottom-end if the element height does not fit container height with overflow', () => {
		const containerRect = createRect(0, 0, 1024, 40);
		const anchorRect = createRect(0, 200, 100, 100);
		const targetRect = createRect(0, 0, 50, 50);
		const placement = 'bottom-end';

		const targetBoundaries = getTargetBoundaries({ anchorRect, targetRect });
		const variantBoundaries = getVariantBoundaries({ anchorRect, targetRect });

		const result = getPositionStyle({
			placement,
			containerRect,
			targetBoundaries,
			variantBoundaries,
			targetRect,
		});

		expect(result.style.overflowY).toEqual('auto');
		expect(result.style.left).toEqual(50);
		expect(result.style.top).toEqual(-5);
	});
});
