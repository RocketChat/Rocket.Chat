import { useState } from 'react';

import { renderHook, act } from './testing';
import { useStableArray } from './useStableArray';

it('uses same-value equality by default', () => {
	const initialSymbolValue = Symbol('initial');
	const finalSymbolValue = Symbol('final');
	const initialNumberValue = -0;
	const finalNumberValue = 0;

	const { result } = renderHook(() => {
		const [array, setArray] = useState([initialSymbolValue, initialNumberValue]);
		const stableArray = useStableArray(array);
		return { setArray, stableArray };
	});
	const { setArray } = result.current;

	const stableArrayA = result.current.stableArray;
	expect(result.current.stableArray).toEqual([initialSymbolValue, initialNumberValue]);

	act(() => {
		setArray([initialSymbolValue, initialNumberValue]);
	});

	const stableArrayB = result.current.stableArray;
	expect(stableArrayB).toBe(stableArrayA);
	expect(result.current.stableArray).toEqual([initialSymbolValue, initialNumberValue]);

	act(() => {
		setArray([finalSymbolValue, initialNumberValue]);
	});

	const stableArrayC = result.current.stableArray;
	expect(stableArrayC).not.toBe(stableArrayB);
	expect(result.current.stableArray).toEqual([finalSymbolValue, initialNumberValue]);

	act(() => {
		setArray([finalSymbolValue, initialNumberValue]);
	});

	const stableArrayD = result.current.stableArray;
	expect(stableArrayD).toBe(stableArrayC);
	expect(result.current.stableArray).toEqual([finalSymbolValue, initialNumberValue]);

	act(() => {
		setArray([finalSymbolValue, finalNumberValue]);
	});

	const stableArrayE = result.current.stableArray;
	expect(stableArrayE).not.toBe(stableArrayD);
	expect(result.current.stableArray).toEqual([finalSymbolValue, finalNumberValue]);

	act(() => {
		setArray([finalSymbolValue, finalNumberValue]);
	});

	const stableArrayF = result.current.stableArray;
	expect(stableArrayF).toBe(stableArrayE);
	expect(result.current.stableArray).toEqual([finalSymbolValue, finalNumberValue]);
});

it('uses a custom equality function', () => {
	const initialSymbolValue = Symbol('initial');
	const finalSymbolValue = Symbol('final');
	const initialNumberValue = -0;
	const finalNumberValue = 0;
	const compare = (a: unknown, b: unknown): boolean => typeof a === typeof b;

	const { result } = renderHook(() => {
		const [array, setArray] = useState([initialSymbolValue, initialNumberValue]);
		const stableArray = useStableArray(array, compare);
		return { setArray, stableArray };
	});
	const { setArray } = result.current;

	const stableArrayA = result.current.stableArray;
	expect(result.current.stableArray).toEqual([initialSymbolValue, initialNumberValue]);

	act(() => {
		setArray([initialSymbolValue, initialNumberValue]);
	});

	const stableArrayB = result.current.stableArray;
	expect(stableArrayB).toBe(stableArrayA);
	expect(result.current.stableArray).toEqual([initialSymbolValue, initialNumberValue]);

	act(() => {
		setArray([finalSymbolValue, initialNumberValue]);
	});

	const stableArrayC = result.current.stableArray;
	expect(stableArrayC).toBe(stableArrayB);
	expect(result.current.stableArray).toEqual([initialSymbolValue, initialNumberValue]);

	act(() => {
		setArray([finalSymbolValue, initialNumberValue]);
	});

	const stableArrayD = result.current.stableArray;
	expect(stableArrayD).toBe(stableArrayC);
	expect(result.current.stableArray).toEqual([initialSymbolValue, initialNumberValue]);

	act(() => {
		setArray([finalSymbolValue, finalNumberValue]);
	});

	const stableArrayE = result.current.stableArray;
	expect(stableArrayE).toBe(stableArrayD);
	expect(result.current.stableArray).toEqual([initialSymbolValue, initialNumberValue]);

	act(() => {
		setArray([finalSymbolValue, finalNumberValue]);
	});

	const stableArrayF = result.current.stableArray;
	expect(stableArrayF).toBe(stableArrayE);
	expect(result.current.stableArray).toEqual([initialSymbolValue, initialNumberValue]);
});
