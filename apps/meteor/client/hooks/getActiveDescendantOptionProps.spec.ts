import { getActiveDescendantOptionProps } from './getActiveDescendantOptionProps';

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
