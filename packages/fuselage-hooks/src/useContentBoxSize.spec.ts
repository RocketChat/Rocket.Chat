import type { RefObject } from 'react';
import { useRef } from 'react';

import { renderHook, act } from './testing';
import { useContentBoxSize } from './useContentBoxSize';
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
	const { result } = renderHook(() => useContentBoxSize(wrapRef(useRef(null))));

	expect(result.current.inlineSize).toStrictEqual(40);
	expect(result.current.blockSize).toStrictEqual(30);
});

it('gets the observed element size after resize', async () => {
	const { result } = renderHook(() => useContentBoxSize(wrapRef(useRef(null))));

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

	expect(result.current.inlineSize).toStrictEqual(30);
	expect(result.current.blockSize).toStrictEqual(40);

	// triggers MutationObserver
	await act(async () => {
		element.style.boxSizing = 'border-box';
	});

	// waits for debounced state mutation
	await act(async () => {
		jest.advanceTimersByTime(0);
	});

	expect(result.current.inlineSize).toStrictEqual(0);
	expect(result.current.blockSize).toStrictEqual(10);
});

it('debounces the observed element size', async () => {
	const halfDelay = 50;
	const delay = 2 * halfDelay;

	const { result } = renderHook(() => useContentBoxSize(wrapRef(useRef(null)), { debounceDelay: delay }));

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

	expect(result.current.inlineSize).toStrictEqual(40);
	expect(result.current.blockSize).toStrictEqual(30);

	// wait the callback trigger from ResizeObserver
	await act(async () => {
		jest.advanceTimersByTime(halfDelay);
	});

	expect(result.current.inlineSize).toStrictEqual(30);
	expect(result.current.blockSize).toStrictEqual(40);
});
