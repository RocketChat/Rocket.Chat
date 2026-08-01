import { act, renderHook } from '@testing-library/react';

import { CONFERENCE_PROVIDER_MESSAGE, useProviderCallBridge } from './useProviderCallBridge';

/** Stands in for the embedded provider's window; only identity matters to the hook. */
const providerWindow = {} as Window;

const iframeRefTo = (contentWindow: Window | null) => ({
	current: { contentWindow } as HTMLIFrameElement,
});

const post = (data: unknown, source: Window | null = providerWindow) =>
	act(() => {
		window.dispatchEvent(new MessageEvent('message', { data, source }));
	});

const command = (rest: Record<string, unknown>) => ({ type: CONFERENCE_PROVIDER_MESSAGE, ...rest });

describe('useProviderCallBridge', () => {
	it('shows the call bar and the chat panel by default', () => {
		const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

		expect(result.current.callBarVisible).toBe(true);
		expect(result.current.chatVisible).toBe(true);
	});

	describe('set-call-bar-visible', () => {
		it('hides and shows the call bar', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

			post(command({ command: 'set-call-bar-visible', visible: false }));
			expect(result.current.callBarVisible).toBe(false);

			post(command({ command: 'set-call-bar-visible', visible: true }));
			expect(result.current.callBarVisible).toBe(true);
		});

		it('leaves the chat panel alone', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

			post(command({ command: 'set-call-bar-visible', visible: false }));

			expect(result.current.chatVisible).toBe(true);
		});
	});

	describe('set-chat-visible', () => {
		it('hides and shows the chat panel', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

			post(command({ command: 'set-chat-visible', visible: false }));
			expect(result.current.chatVisible).toBe(false);

			post(command({ command: 'set-chat-visible', visible: true }));
			expect(result.current.chatVisible).toBe(true);
		});

		it('is idempotent', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

			post(command({ command: 'set-chat-visible', visible: false }));
			post(command({ command: 'set-chat-visible', visible: false }));

			expect(result.current.chatVisible).toBe(false);
		});
	});

	describe('toggle-chat', () => {
		it('flips the chat panel on each message', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

			post(command({ command: 'toggle-chat' }));
			expect(result.current.chatVisible).toBe(false);

			post(command({ command: 'toggle-chat' }));
			expect(result.current.chatVisible).toBe(true);
		});

		it('flips from whatever state a local toggle left behind', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

			act(() => result.current.toggleChat());
			expect(result.current.chatVisible).toBe(false);

			post(command({ command: 'toggle-chat' }));
			expect(result.current.chatVisible).toBe(true);
		});
	});

	describe('rejects untrusted or malformed messages', () => {
		it('ignores a message from a window that is not the conference iframe', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

			post(command({ command: 'set-call-bar-visible', visible: false }), {} as Window);

			expect(result.current.callBarVisible).toBe(true);
		});

		it('ignores an unrelated message type', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

			post({ type: 'something-else', command: 'toggle-chat' });

			expect(result.current.chatVisible).toBe(true);
		});

		it('ignores an unknown command', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

			post(command({ command: 'self-destruct' }));

			expect(result.current.chatVisible).toBe(true);
			expect(result.current.callBarVisible).toBe(true);
		});

		it('ignores a non-boolean visible flag', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

			post(command({ command: 'set-chat-visible', visible: 'false' }));

			expect(result.current.chatVisible).toBe(true);
		});

		it('ignores non-object payloads', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

			post(null);
			post('toggle-chat');

			expect(result.current.chatVisible).toBe(true);
		});

		it('ignores messages while the iframe has no content window', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(null)));

			post(command({ command: 'toggle-chat' }), null);

			expect(result.current.chatVisible).toBe(true);
		});
	});

	it('stops listening once unmounted', () => {
		const ref = iframeRefTo(providerWindow);
		const { result, unmount } = renderHook(() => useProviderCallBridge(ref));

		unmount();
		post(command({ command: 'set-chat-visible', visible: false }));

		expect(result.current.chatVisible).toBe(true);
	});
});
