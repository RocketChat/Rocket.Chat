import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useAutoupdate } from './useAutoupdate';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useToastMessageDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

describe('useAutoupdate', () => {
	it('should add event listener to document on mount', () => {
		const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
		renderHook(() => useAutoupdate());
		expect(addEventListenerSpy).toHaveBeenCalled();
		expect(addEventListenerSpy).toHaveBeenCalledWith('client_changed', expect.any(Function));
	});

	it('should remove event listener on unmount', () => {
		const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
		const { unmount } = renderHook(() => useAutoupdate());
		unmount();
		expect(removeEventListenerSpy).toHaveBeenCalled();
		expect(removeEventListenerSpy).toHaveBeenCalledWith('client_changed', expect.any(Function));
	});

	it('should call toast function when client_changed event is fired', () => {
		const toastMock = jest.fn();
		(useToastMessageDispatch as jest.Mock).mockImplementation(() => toastMock);
		renderHook(() => useAutoupdate());

		const event = new Event('client_changed');
		document.dispatchEvent(event);

		expect(toastMock).toHaveBeenCalledTimes(1);
		expect(toastMock).toHaveBeenCalledWith({
			type: 'info',
			message: expect.anything(),
			options: { isPersistent: true },
		});
	});

	it('should not call toast function when client_changed event is not fired', () => {
		const toastMock = jest.fn();
		(useToastMessageDispatch as jest.Mock).mockImplementation(() => toastMock);
		renderHook(() => useAutoupdate());
		expect(toastMock).not.toHaveBeenCalled();
	});
});
