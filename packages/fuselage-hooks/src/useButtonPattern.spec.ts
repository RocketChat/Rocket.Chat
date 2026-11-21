import type { KeyboardEvent } from 'react';

import { renderHook } from './testing';
import { useButtonPattern } from './useButtonPattern';

it('should return the button props', () => {
	const fakeAction = () => console.log('fake action dispatched!');
	const { result } = renderHook(() => useButtonPattern(fakeAction));

	expect(result.current.onClick).toBeDefined();
	expect(result.current.onKeyDown).toBeDefined();
	expect(result.current.role).toBeDefined();
	expect(result.current.tabIndex).toBeDefined();
});

describe('keyboard activation', () => {
	const pressKey = (init: { key: string; code: string }) => {
		const onPress = jest.fn();
		const { result } = renderHook(() => useButtonPattern(onPress));
		const preventDefault = jest.fn();

		result.current.onKeyDown({ ...init, preventDefault } as unknown as KeyboardEvent<Element>);

		return { onPress, preventDefault };
	};

	it.each([
		['Enter', { key: 'Enter', code: 'Enter' }],
		['the numeric keypad Enter', { key: 'Enter', code: 'NumpadEnter' }],
		['Space', { key: ' ', code: 'Space' }],
	])('should press on %s', (_, init) => {
		const { onPress, preventDefault } = pressKey(init);

		expect(onPress).toHaveBeenCalledTimes(1);
		expect(preventDefault).toHaveBeenCalledTimes(1);
	});

	it('should ignore other keys', () => {
		const { onPress, preventDefault } = pressKey({ key: 'a', code: 'KeyA' });

		expect(onPress).not.toHaveBeenCalled();
		expect(preventDefault).not.toHaveBeenCalled();
	});
});
