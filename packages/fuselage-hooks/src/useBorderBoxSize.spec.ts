import type { RefObject } from 'react';
import { useRef } from 'react';

import { renderHook, act } from './testing';
import { useBorderBoxSize } from './useBorderBoxSize';
import { withResizeObserverMock } from '../mocks/withResizeObserverMock';

withResizeObserverMock();

beforeAll(() => {
	jest.useFakeTimers();
});

let element: HTMLElement;

beforeEach(() => {
	element = document.createElement('div');
	element.style.width = '40px';
	element.style.height = '30px';
	element.style.padding = '5px';
	document.body.append(element);
});

afterEach(() => {
	element.remove();
});

const wrapRef = (ref: RefObject<HTMLElement | null>) => {
	Object.assign(ref, { current: element });
	return ref;
};

it('immediately returns size', async () => {
	const { result } = renderHook(() => useBorderBoxSize(wrapRef(useRef(null))));

	expect(result.current.inlineSize).toStrictEqual(50);
	expect(result.current.blockSize).toStrictEqual(40);
});

it('gets the observed element size after resize', async () => {
	const { result } = renderHook(() => useBorderBoxSize(wrapRef(useRef(null))));

	// triggers MutationObserver
	await act(async () => {
		element.style.width = '30px';
		element.style.height = '40px';
		element.style.padding = '15px';
	});

	// waits for debounced state mutation
	await act(async () => {
		jest.advanceTimersByTime(0);
	});

	expect(result.current.inlineSize).toStrictEqual(60);
	expect(result.current.blockSize).toStrictEqual(70);

	// triggers MutationObserver
	await act(async () => {
		element.style.boxSizing = 'border-box';
	});

	// waits for debounced state mutation
	await act(async () => {
		jest.advanceTimersByTime(0);
	});

	expect(result.current.inlineSize).toStrictEqual(30);
	expect(result.current.blockSize).toStrictEqual(40);
});

it('debounces the observed element size', async () => {
	const halfDelay = 50;
	const delay = 2 * halfDelay;

	const { result } = renderHook(() => useBorderBoxSize(wrapRef(useRef(null)), { debounceDelay: delay }));

	// triggers MutationObserver
	await act(async () => {
		element.style.width = '30px';
		element.style.height = '40px';
		element.style.padding = '15px';
	});

	// waits for debounced state mutation
	await act(async () => {
		jest.advanceTimersByTime(halfDelay);
	});

	expect(result.current.inlineSize).toStrictEqual(50);
	expect(result.current.blockSize).toStrictEqual(40);

	// wait the callback trigger from ResizeObserver
	await act(async () => {
		jest.advanceTimersByTime(halfDelay);
	});

	expect(result.current.inlineSize).toStrictEqual(60);
	expect(result.current.blockSize).toStrictEqual(70);
});
