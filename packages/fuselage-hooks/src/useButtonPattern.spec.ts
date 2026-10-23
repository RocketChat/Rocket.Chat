import type { KeyboardEvent, MouseEvent } from 'react';

import { renderHook } from './testing';
import { useButtonPattern } from './useButtonPattern';

describe('useButtonPattern', () => {
	it('should return the button props', () => {
		const fakeAction = () => console.log('fake action dispatched!');
		const { result } = renderHook(() => useButtonPattern(fakeAction));

		expect(result.current.onClick).toBeDefined();
		expect(result.current.onKeyDown).toBeDefined();
		expect(result.current.role).toBeDefined();
		expect(result.current.tabIndex).toBeDefined();
	});

	it('should trigger onPress on Space and Enter when target matches currentTarget', () => {
		const onPress = jest.fn();
		const { result } = renderHook(() => useButtonPattern(onPress));

		const element = document.createElement('div');
		const preventDefault = jest.fn();

		const enterEvent = {
			code: 'Enter',
			target: element,
			currentTarget: element,
			preventDefault,
		} as unknown as KeyboardEvent<Element>;

		result.current.onKeyDown(enterEvent);
		expect(preventDefault).toHaveBeenCalledTimes(1);
		expect(onPress).toHaveBeenCalledWith(enterEvent);

		const spaceEvent = {
			code: 'Space',
			target: element,
			currentTarget: element,
			preventDefault,
		} as unknown as KeyboardEvent<Element>;

		result.current.onKeyDown(spaceEvent);
		expect(preventDefault).toHaveBeenCalledTimes(2);
		expect(onPress).toHaveBeenCalledWith(spaceEvent);
	});

	it('should not trigger onPress when event target does not match currentTarget', () => {
		const onPress = jest.fn();
		const { result } = renderHook(() => useButtonPattern(onPress));

		const parentElement = document.createElement('div');
		const childElement = document.createElement('button');
		const preventDefault = jest.fn();

		const bubbledEvent = {
			code: 'Enter',
			target: childElement,
			currentTarget: parentElement,
			preventDefault,
		} as unknown as KeyboardEvent<Element>;

		result.current.onKeyDown(bubbledEvent);
		expect(preventDefault).not.toHaveBeenCalled();
		expect(onPress).not.toHaveBeenCalled();

		const bubbledSpaceEvent = {
			code: 'Space',
			target: childElement,
			currentTarget: parentElement,
			preventDefault,
		} as unknown as KeyboardEvent<Element>;

		result.current.onKeyDown(bubbledSpaceEvent);
		expect(preventDefault).not.toHaveBeenCalled();
		expect(onPress).not.toHaveBeenCalled();
	});

	it('should trigger onPress on click when target is the element or a non-interactive child', () => {
		const onPress = jest.fn();
		const { result } = renderHook(() => useButtonPattern(onPress));

		const parentElement = document.createElement('div');
		const spanChild = document.createElement('span');
		parentElement.appendChild(spanChild);

		const clickOnParent = {
			target: parentElement,
			currentTarget: parentElement,
		} as unknown as MouseEvent<Element>;

		result.current.onClick(clickOnParent);
		expect(onPress).toHaveBeenCalledTimes(1);

		const clickOnSpan = {
			target: spanChild,
			currentTarget: parentElement,
		} as unknown as MouseEvent<Element>;

		result.current.onClick(clickOnSpan);
		expect(onPress).toHaveBeenCalledTimes(2);
	});

	it('should not trigger onPress on click when target is a nested interactive element', () => {
		const onPress = jest.fn();
		const { result } = renderHook(() => useButtonPattern(onPress));

		const parentElement = document.createElement('div');
		const nestedLink = document.createElement('a');
		const nestedButton = document.createElement('button');
		parentElement.appendChild(nestedLink);
		parentElement.appendChild(nestedButton);

		const clickOnLink = {
			target: nestedLink,
			currentTarget: parentElement,
		} as unknown as MouseEvent<Element>;

		result.current.onClick(clickOnLink);
		expect(onPress).not.toHaveBeenCalled();

		const clickOnButton = {
			target: nestedButton,
			currentTarget: parentElement,
		} as unknown as MouseEvent<Element>;

		result.current.onClick(clickOnButton);
		expect(onPress).not.toHaveBeenCalled();
	});
});


