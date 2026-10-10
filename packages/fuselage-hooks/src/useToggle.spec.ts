import { renderHook, act } from './testing';
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

it('toggles false to true when toggleValue is called', () => {
	const { result } = renderHook(() => useToggle(false));
	const [, toggle] = result.current;

	act(() => {
		toggle();
	});

	const [enabled] = result.current;
	expect(enabled).toBe(true);
});

it('toggles false to true when toggleValue is called twice in the same render cycle', () => {
	const { result } = renderHook(() => useToggle(false));
	const [, toggle] = result.current;

	act(() => {
		toggle();
		toggle();
	});

	const [enabled] = result.current;
	expect(enabled).toBe(true);
});

it('toggles false to false when toggleValue is called at two render cycles', () => {
	const { result } = renderHook(() => useToggle(false));
	const [, toggle] = result.current;

	act(() => {
		toggle();
	});

	act(() => {
		toggle();
	});

	const [enabled] = result.current;
	expect(enabled).toBe(false);
});

it('forces false argument on toggleValue', () => {
	const { result } = renderHook(() => useToggle(false));
	const [, toggle] = result.current;

	act(() => {
		toggle(false);
	});

	const [enabled] = result.current;
	expect(enabled).toBe(false);
});

it('forces true argument on toggleValue', () => {
	const { result } = renderHook(() => useToggle(true));
	const [, toggle] = result.current;

	act(() => {
		toggle(true);
	});

	const [enabled] = result.current;
	expect(enabled).toBe(true);
});
