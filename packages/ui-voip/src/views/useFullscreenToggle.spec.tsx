import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useFullscreenToggle } from './useFullscreenToggle';

const dispatchToastMessage = jest.fn();

const createWrapper = () =>
	mockAppRoot()
		.withTranslations('en', 'core', {
			Fullscreen_failed_to_switch_not_allowed: 'Switching to fullscreen was not allowed, please check your browser settings.',
		})
		.withToastMessageDispatch(dispatchToastMessage)
		.build();

const setFullscreenElement = (element: Element | null) => {
	Object.defineProperty(document, 'fullscreenElement', { value: element, writable: true, configurable: true });
};

const setFullscreenEnabled = (enabled: boolean) => {
	Object.defineProperty(document, 'fullscreenEnabled', { value: enabled, writable: true, configurable: true });
};

describe('useFullscreenToggle', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setFullscreenElement(null);
		setFullscreenEnabled(true);
		Object.defineProperty(document, 'exitFullscreen', {
			value: jest.fn().mockResolvedValue(undefined),
			writable: true,
			configurable: true,
		});
		Object.defineProperty(document.documentElement, 'requestFullscreen', {
			value: jest.fn().mockResolvedValue(undefined),
			writable: true,
			configurable: true,
		});
	});

	it('reflects the initial fullscreen and enabled state from the document', () => {
		setFullscreenElement(document.body);
		setFullscreenEnabled(true);

		const { result } = renderHook(() => useFullscreenToggle(), { wrapper: createWrapper() });

		expect(result.current.fullscreen).toBe(true);
		expect(result.current.enabled).toBe(true);
	});

	it('reports fullscreen as false when there is no fullscreen element', () => {
		setFullscreenElement(null);

		const { result } = renderHook(() => useFullscreenToggle(), { wrapper: createWrapper() });

		expect(result.current.fullscreen).toBe(false);
	});

	it('reports enabled as false when the document does not support fullscreen', () => {
		setFullscreenEnabled(false);

		const { result } = renderHook(() => useFullscreenToggle(), { wrapper: createWrapper() });

		expect(result.current.enabled).toBe(false);
	});

	it('updates state when a fullscreenchange event is dispatched', () => {
		const { result } = renderHook(() => useFullscreenToggle(), { wrapper: createWrapper() });

		expect(result.current.fullscreen).toBe(false);

		act(() => {
			setFullscreenElement(document.body);
			document.dispatchEvent(new Event('fullscreenchange'));
		});

		expect(result.current.fullscreen).toBe(true);

		act(() => {
			setFullscreenElement(null);
			document.dispatchEvent(new Event('fullscreenchange'));
		});

		expect(result.current.fullscreen).toBe(false);
	});

	it('requests fullscreen on documentElement when not currently fullscreen', async () => {
		setFullscreenElement(null);

		const { result } = renderHook(() => useFullscreenToggle(), { wrapper: createWrapper() });

		await act(async () => {
			await result.current.toggleFullscreen();
		});

		expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
		expect(document.exitFullscreen).not.toHaveBeenCalled();
	});

	it('exits fullscreen when currently fullscreen', async () => {
		setFullscreenElement(document.body);

		const { result } = renderHook(() => useFullscreenToggle(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.fullscreen).toBe(true));

		await act(async () => {
			await result.current.toggleFullscreen();
		});

		expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
		expect(document.documentElement.requestFullscreen).not.toHaveBeenCalled();
	});

	it('does nothing when fullscreen is not enabled', async () => {
		setFullscreenEnabled(false);

		const { result } = renderHook(() => useFullscreenToggle(), { wrapper: createWrapper() });

		await act(async () => {
			await result.current.toggleFullscreen();
		});

		expect(document.documentElement.requestFullscreen).not.toHaveBeenCalled();
		expect(document.exitFullscreen).not.toHaveBeenCalled();
	});

	it('dispatches an error toast when requestFullscreen rejects', async () => {
		setFullscreenElement(null);
		(document.documentElement.requestFullscreen as jest.Mock).mockRejectedValueOnce(new Error('not allowed'));

		const { result } = renderHook(() => useFullscreenToggle(), { wrapper: createWrapper() });

		await act(async () => {
			await result.current.toggleFullscreen();
		});

		expect(dispatchToastMessage).toHaveBeenCalledWith({
			type: 'error',
			message: 'Switching to fullscreen was not allowed, please check your browser settings.',
		});
	});

	it('dispatches an error toast when exitFullscreen rejects', async () => {
		setFullscreenElement(document.body);
		(document.exitFullscreen as jest.Mock).mockRejectedValueOnce(new Error('not allowed'));

		const { result } = renderHook(() => useFullscreenToggle(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.fullscreen).toBe(true));

		await act(async () => {
			await result.current.toggleFullscreen();
		});

		expect(dispatchToastMessage).toHaveBeenCalledWith({
			type: 'error',
			message: 'Switching to fullscreen was not allowed, please check your browser settings.',
		});
	});
});
