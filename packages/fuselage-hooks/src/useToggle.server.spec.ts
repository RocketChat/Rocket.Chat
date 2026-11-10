import { renderHook } from './testing';
import { useToggle } from './useToggle';

it('has false value when an initial value is undefined', () => {
	const { result } = renderHook(() => useToggle());

	const [enabled] = result.current;
	expect(enabled).toBe(false);
});

it('has false value when an initial value is false', () => {
	const { result } = renderHook(() => useToggle(false));

	const [enabled] = result.current;
	expect(enabled).toBe(false);
});

it('has false value when an initial value is falsy', () => {
	const { result } = renderHook(() => useToggle(0 as any));

	const [enabled] = result.current;
	expect(enabled).toBe(false);
});

it('has false value when an initial value is a function returning false', () => {
	const { result } = renderHook(() => useToggle(() => false));

	const [enabled] = result.current;
	expect(enabled).toBe(false);
});

it('has true value when an initial value is true', () => {
	const { result } = renderHook(() => useToggle(true));

	const [enabled] = result.current;
	expect(enabled).toBe(true);
});

it('has true value when an initial value is truthy', () => {
	const { result } = renderHook(() => useToggle(1 as any));

	const [enabled] = result.current;
	expect(enabled).toBe(true);
});

it('has true value when an initial value is a function returning true', () => {
	const { result } = renderHook(() => useToggle(() => true));

	const [enabled] = result.current;
	expect(enabled).toBe(true);
});
