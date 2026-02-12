import type { RefObject } from 'react';
import { renderHook } from '@testing-library/react';

import { usePreventDefault } from './usePreventDefault';

describe('usePreventDefault (sidebar)', () => {
	it('should add click listener on mount', () => {
		const element = document.createElement('div');
		const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
		const ref = { current: element } as RefObject<Element>;

		renderHook(() => usePreventDefault(ref));

		expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
	});

	it('should remove click listener on unmount', () => {
		const element = document.createElement('div');
		const addEventListenerSpy = jest.spyOn(element, 'addEventListener');
		const removeEventListenerSpy = jest.spyOn(element, 'removeEventListener');
		const ref = { current: element } as RefObject<Element>;
		const { unmount } = renderHook(() => usePreventDefault(ref));

		const listener = addEventListenerSpy.mock.calls.find(([eventName]) => eventName === 'click')?.[1];
		expect(listener).toEqual(expect.any(Function));

		unmount();

		expect(removeEventListenerSpy).toHaveBeenCalledWith('click', listener as EventListener);
	});
});
