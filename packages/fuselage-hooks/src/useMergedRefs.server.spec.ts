import { createRef } from 'react';

import { renderHook } from './testing';
import { useMergedRefs } from './useMergedRefs';

it('returns a callback ref', () => {
	const { result } = renderHook(() => useMergedRefs());

	expect(result.current).toEqual(expect.any(Function));
});

it('works without any arguments', () => {
	const { result } = renderHook(() => jest.fn(useMergedRefs()));

	const value = Symbol();
	result.current(value);

	expect(result.current).toHaveBeenCalledWith(value);
});

it('works with one ref', () => {
	const ref = createRef();

	const { result } = renderHook(() => useMergedRefs(ref));

	const value = Symbol();
	result.current(value);

	expect(ref.current).toBe(value);
});

it('works with many refs', () => {
	const refs = Array.from({ length: 10 }).map(() => createRef());

	const { result } = renderHook(() => useMergedRefs(...refs));

	const value = Symbol();
	result.current(value);

	refs.forEach((ref) => expect(ref.current).toBe(value));
});

it('works with callback ref', () => {
	const callbackRef = jest.fn();

	const { result } = renderHook(() => useMergedRefs(callbackRef));

	const value = Symbol();
	result.current(value);

	expect(callbackRef).toHaveBeenCalledWith(value);
});

it('works with refs and callback refs', () => {
	const refs = Array.from({ length: 5 }).map(() => createRef());
	const callbackRefs = Array.from({ length: 5 }).map(() => jest.fn());

	const { result } = renderHook(() => useMergedRefs(...refs, ...callbackRefs));

	const value = Symbol();
	result.current(value);

	refs.forEach((ref) => expect(ref.current).toBe(value));
	callbackRefs.forEach((callbackRef) => expect(callbackRef).toHaveBeenCalledWith(value));
});
