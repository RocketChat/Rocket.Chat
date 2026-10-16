import { act, renderHook } from '@testing-library/react';

import { getActiveDescendantOptionProps, useActiveDescendant } from './useActiveDescendant';

describe('useActiveDescendant', () => {
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
	});

	it('should hide the focus ring when the pointer moves the active option', () => {
		const { result } = renderHook(() => useActiveDescendant<string>());

		act(() => result.current.moveByKeyboard('a'));
		act(() => result.current.moveByPointer('b'));

		expect(result.current.active).toBe('b');
		expect(result.current.focusVisible).toBe(false);
	});
});

describe('getActiveDescendantOptionProps', () => {
	it('should ring only the active option', () => {
		expect(getActiveDescendantOptionProps(true, true, jest.fn())).toMatchObject({
			'focused': true,
			'focusVisible': true,
			'aria-selected': true,
		});
		expect(getActiveDescendantOptionProps(false, true, jest.fn())).toMatchObject({
			'focused': false,
			'focusVisible': false,
			'aria-selected': false,
		});
	});

	it('should activate an inactive option when the pointer moves over it', () => {
		const activate = jest.fn();

		getActiveDescendantOptionProps(false, false, activate).onPointerMove();
		getActiveDescendantOptionProps(true, false, activate).onPointerMove();

		expect(activate).toHaveBeenCalledTimes(1);
	});

	it('should hand the active option to the pointer while it shows the focus ring', () => {
		const activate = jest.fn();

		getActiveDescendantOptionProps(true, true, activate).onPointerMove();

		expect(activate).toHaveBeenCalledTimes(1);
	});
});
