import { act, renderHook } from './testing';
import { useActiveDescendant } from './useActiveDescendant';

it('should start with no active option and no focus ring', () => {
	const { result } = renderHook(() => useActiveDescendant<string>());

	expect(result.current.active).toBeUndefined();
	expect(result.current.focusVisible).toBe(false);
});

it('should show the focus ring when the keyboard moves the active option', () => {
	const { result } = renderHook(() => useActiveDescendant<string>());

	act(() => result.current.moveByKeyboard('a'));
	expect(result.current.active).toBe('a');
	expect(result.current.focusVisible).toBe(true);

	act(() => result.current.moveByKeyboard((previous) => `${previous}b`));
	expect(result.current.active).toBe('ab');
	expect(result.current.focusVisible).toBe(true);
});

it('should hide the focus ring when the pointer moves the active option', () => {
	const { result } = renderHook(() => useActiveDescendant<string>());

	act(() => result.current.moveByKeyboard('a'));
	act(() => result.current.moveByPointer('b'));

	expect(result.current.active).toBe('b');
	expect(result.current.focusVisible).toBe(false);
});
