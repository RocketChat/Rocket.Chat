import { renderHook, act } from '@testing-library/react';

import { useOpenVideoCall } from './useOpenVideoCall';

const setModalMock = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useSetModal: () => setModalMock,
}));

jest.mock('../views', () => ({
	PopupBlockedModal: jest.fn(() => null),
}));

const { PopupBlockedModal } = jest.requireMock('../views');

describe('useOpenVideoCall', () => {
	const url = 'https://video.example.com/room';

	beforeEach(() => {
		jest.clearAllMocks();
		delete (window as any).RocketChatDesktop;
		jest.spyOn(window, 'open').mockReturnValue({} as Window);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('when RocketChatDesktop.openInternalVideoChatWindow is available', () => {
		const openInternalVideoChatWindowMock = jest.fn();

		beforeEach(() => {
			(window as any).RocketChatDesktop = {
				openInternalVideoChatWindow: openInternalVideoChatWindowMock,
			};
		});

		it('calls openInternalVideoChatWindow with the url and providerName', () => {
			const { result } = renderHook(() => useOpenVideoCall());

			act(() => {
				result.current(url, 'Jitsi');
			});

			expect(openInternalVideoChatWindowMock).toHaveBeenCalledWith(url, { providerName: 'Jitsi' });
		});

		it('calls openInternalVideoChatWindow with undefined providerName when not provided', () => {
			const { result } = renderHook(() => useOpenVideoCall());

			act(() => {
				result.current(url);
			});

			expect(openInternalVideoChatWindowMock).toHaveBeenCalledWith(url, { providerName: undefined });
		});

		it('does not call window.open', () => {
			const { result } = renderHook(() => useOpenVideoCall());

			act(() => {
				result.current(url, 'Jitsi');
			});

			expect(window.open).not.toHaveBeenCalled();
		});

		it('does not show a modal', () => {
			const { result } = renderHook(() => useOpenVideoCall());

			act(() => {
				result.current(url, 'Jitsi');
			});

			expect(setModalMock).not.toHaveBeenCalled();
		});
	});

	describe('when RocketChatDesktop is not available', () => {
		it('calls window.open with the url', () => {
			const { result } = renderHook(() => useOpenVideoCall());

			act(() => {
				result.current(url);
			});

			expect(window.open).toHaveBeenCalledWith(url);
		});

		it('does not show a modal when window.open succeeds', () => {
			const { result } = renderHook(() => useOpenVideoCall());

			act(() => {
				result.current(url);
			});

			expect(setModalMock).not.toHaveBeenCalled();
		});

		describe('when window.open returns null (popup blocked)', () => {
			beforeEach(() => {
				jest.spyOn(window, 'open').mockReturnValue(null);
			});

			it('shows PopupBlockedModal', () => {
				const { result } = renderHook(() => useOpenVideoCall());

				act(() => {
					result.current(url);
				});

				expect(setModalMock).toHaveBeenCalledTimes(1);
				const [[modalElement]] = setModalMock.mock.calls;
				expect(modalElement.type).toBe(PopupBlockedModal);
			});

			it('closes modal when onClose is called', () => {
				const { result } = renderHook(() => useOpenVideoCall());

				act(() => {
					result.current(url);
				});

				const [[modalElement]] = setModalMock.mock.calls;
				act(() => {
					modalElement.props.onClose();
				});

				expect(setModalMock).toHaveBeenLastCalledWith(null);
			});

			it('opens url in new window when onConfirm is called', () => {
				const { result } = renderHook(() => useOpenVideoCall());

				act(() => {
					result.current(url);
				});

				const [[modalElement]] = setModalMock.mock.calls;
				act(() => {
					modalElement.props.onConfirm();
				});

				expect(window.open).toHaveBeenLastCalledWith(url);
			});
		});
	});

	describe('when RocketChatDesktop exists but openInternalVideoChatWindow is not defined', () => {
		beforeEach(() => {
			(window as any).RocketChatDesktop = {};
		});

		it('falls back to window.open', () => {
			const { result } = renderHook(() => useOpenVideoCall());

			act(() => {
				result.current(url);
			});

			expect(window.open).toHaveBeenCalledWith(url);
		});
	});
});
