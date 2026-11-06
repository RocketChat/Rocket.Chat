import { renderHook } from '@testing-library/react';

import { useTypeahead } from './useTypeahead';

const labels = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry'];

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

it('should find the next option starting with the typed character', () => {
	const { result } = renderHook(() => useTypeahead());

	expect(result.current.search('b', labels, 0)).toBe(2);
});

it('should ignore the case of the typed character', () => {
	const { result } = renderHook(() => useTypeahead());

	expect(result.current.search('C', labels, 0)).toBe(4);
});

it('should match the characters typed in a row as one query', () => {
	const { result } = renderHook(() => useTypeahead());

	expect(result.current.search('a', labels, -1)).toBe(0);
	expect(result.current.search('p', labels, 0)).toBe(0);
	expect(result.current.search('r', labels, 0)).toBe(1);
});

it('should cycle through the options starting with a repeated character', () => {
	const { result } = renderHook(() => useTypeahead());

	expect(result.current.search('b', labels, 0)).toBe(2);
	expect(result.current.search('b', labels, 2)).toBe(3);
	expect(result.current.search('b', labels, 3)).toBe(2);
});

it('should start a new query after a pause', () => {
	const { result } = renderHook(() => useTypeahead(500));

	expect(result.current.search('a', labels, -1)).toBe(0);
	jest.advanceTimersByTime(501);
	expect(result.current.search('c', labels, 0)).toBe(4);
});

it('should return -1 when no option matches', () => {
	const { result } = renderHook(() => useTypeahead());

	expect(result.current.search('z', labels, 0)).toBe(-1);
});

it('should tell whether a query is still being typed', () => {
	const { result } = renderHook(() => useTypeahead(500));

	expect(result.current.isSearching()).toBe(false);
	result.current.search('a', labels, -1);
	expect(result.current.isSearching()).toBe(true);
	jest.advanceTimersByTime(501);
	expect(result.current.isSearching()).toBe(false);
});

it('should match a space typed within a query', () => {
	const { result } = renderHook(() => useTypeahead());
	const spaced = ['a test 1', 'a test 2', 'another'];

	expect(result.current.search('a', spaced, -1)).toBe(0);
	expect(result.current.search(' ', spaced, 0)).toBe(0);
	expect(result.current.search('t', spaced, 0)).toBe(0);
	expect(result.current.search('e', spaced, 0)).toBe(0);
	expect(result.current.search('s', spaced, 0)).toBe(0);
	expect(result.current.search('t', spaced, 0)).toBe(0);
	expect(result.current.search(' ', spaced, 0)).toBe(0);
	expect(result.current.search('2', spaced, 0)).toBe(1);
});
