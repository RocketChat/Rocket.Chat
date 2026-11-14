import { act, renderHook } from '@testing-library/react';

import { useElementHeight } from './useElementHeight';

const elementOfHeight = (initial: number) => {
	const element = document.createElement('div');
	let height = initial;
	Object.defineProperty(element, 'offsetHeight', { configurable: true, get: () => height });
	const resizeTo = (next: number) => {
		height = next;
	};
	return { element, resizeTo };
};

const lastObserver = () => {
	const observers = jest.mocked(ResizeObserver);
	return { observer: observers.mock.results.at(-1)?.value as ResizeObserver, onResize: observers.mock.calls.at(-1)?.[0] };
};

it('measures the element once it is attached (R61)', () => {
	const { result } = renderHook(() => useElementHeight());
	const { element } = elementOfHeight(40);
	expect(result.current[1]).toBe(0);

	act(() => {
		result.current[0](element);
	});

	expect(result.current[1]).toBe(40);
	expect(lastObserver().observer.observe).toHaveBeenCalledWith(element);
});

it('follows the element as it resizes (R61)', () => {
	const { result } = renderHook(() => useElementHeight());
	const { element, resizeTo } = elementOfHeight(40);
	act(() => {
		result.current[0](element);
	});

	resizeTo(64);
	act(() => lastObserver().onResize?.([], lastObserver().observer));

	expect(result.current[1]).toBe(64);
});

it('stops observing and gives 0 once the element is detached (R61)', () => {
	const { result } = renderHook(() => useElementHeight());
	const { element } = elementOfHeight(40);
	let detach: ReturnType<(typeof result.current)[0]>;
	act(() => {
		detach = result.current[0](element);
	});
	const { observer } = lastObserver();

	act(() => {
		if (typeof detach === 'function') {
			detach();
		}
	});

	expect(observer.disconnect).toHaveBeenCalled();
	expect(result.current[1]).toBe(0);
});
