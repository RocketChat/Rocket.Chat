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

const render = () => renderHook(() => useProviderCallBridge(iframeRefTo(providerWindow)));

describe('useProviderCallBridge', () => {
	// On arriving in a call the useful question is who else is here — and for the caller of a call that is still
	// ringing, the members list is the only place that answers it.
	it('shows the call bar and opens the members list by default', () => {
		const { result } = render();

		expect(result.current.callBarVisible).toBe(true);
		expect(result.current.activePanel).toBe('members');
	});

	describe('one panel at a time', () => {
		// They share the same space, so two open panels would leave the call a sliver.
		it('replaces the open panel rather than opening a second one', () => {
			const { result } = render();

			act(() => result.current.togglePanel('chat'));

			expect(result.current.activePanel).toBe('chat');
		});

		it('closes the panel when its own button is used again', () => {
			const { result } = render();

			act(() => result.current.togglePanel('members'));

			expect(result.current.activePanel).toBeUndefined();
		});

		it('reopens a panel that was closed', () => {
			const { result } = render();

			act(() => result.current.togglePanel('members'));
			act(() => result.current.togglePanel('members'));

			expect(result.current.activePanel).toBe('members');
		});
	});

	describe('set-call-bar-visible', () => {
		it('hides and shows the call bar', () => {
			const { result } = render();

			post(command({ command: 'set-call-bar-visible', visible: false }));
			expect(result.current.callBarVisible).toBe(false);

			post(command({ command: 'set-call-bar-visible', visible: true }));
			expect(result.current.callBarVisible).toBe(true);
		});

		it('leaves the open panel alone', () => {
			const { result } = render();

			post(command({ command: 'set-call-bar-visible', visible: false }));

			expect(result.current.activePanel).toBe('members');
		});
	});

	describe('set-chat-visible', () => {
		it('opens and closes the chat panel', () => {
			const { result } = render();

			post(command({ command: 'set-chat-visible', visible: true }));
			expect(result.current.activePanel).toBe('chat');

			post(command({ command: 'set-chat-visible', visible: false }));
			expect(result.current.activePanel).toBeUndefined();
		});

		// The command predates there being more than one panel, so hiding the chat must not be read as "close
		// whatever is open" — that would shut the members list a provider never asked about.
		it('leaves another panel open when asked to hide the chat', () => {
			const { result } = render();

			post(command({ command: 'set-chat-visible', visible: false }));

			expect(result.current.activePanel).toBe('members');
		});

		it('is idempotent', () => {
			const { result } = render();

			post(command({ command: 'set-chat-visible', visible: true }));
			post(command({ command: 'set-chat-visible', visible: true }));

			expect(result.current.activePanel).toBe('chat');
		});
	});

	describe('toggle-chat', () => {
		it('flips the chat panel on each message', () => {
			const { result } = render();

			post(command({ command: 'toggle-chat' }));
			expect(result.current.activePanel).toBe('chat');

			post(command({ command: 'toggle-chat' }));
			expect(result.current.activePanel).toBeUndefined();
		});

		it('flips from whatever state a local toggle left behind', () => {
			const { result } = render();

			act(() => result.current.togglePanel('chat'));
			expect(result.current.activePanel).toBe('chat');

			post(command({ command: 'toggle-chat' }));
			expect(result.current.activePanel).toBeUndefined();
		});
	});

	describe('rejects untrusted or malformed messages', () => {
		it('ignores a message from a window that is not the conference iframe', () => {
			const { result } = render();

			post(command({ command: 'set-call-bar-visible', visible: false }), {} as Window);

			expect(result.current.callBarVisible).toBe(true);
		});

		it('ignores an unrelated message type', () => {
			const { result } = render();

			post({ type: 'something-else', command: 'toggle-chat' });

			expect(result.current.activePanel).toBe('members');
		});

		it('ignores an unknown command', () => {
			const { result } = render();

			post(command({ command: 'self-destruct' }));

			expect(result.current.activePanel).toBe('members');
			expect(result.current.callBarVisible).toBe(true);
		});

		it('ignores a non-boolean visible flag', () => {
			const { result } = render();

			post(command({ command: 'set-chat-visible', visible: 'true' }));

			expect(result.current.activePanel).toBe('members');
		});

		it('ignores non-object payloads', () => {
			const { result } = render();

			post(null);
			post('toggle-chat');

			expect(result.current.activePanel).toBe('members');
		});

		it('ignores messages while the iframe has no content window', () => {
			const { result } = renderHook(() => useProviderCallBridge(iframeRefTo(null)));

			post(command({ command: 'toggle-chat' }), null);

			expect(result.current.activePanel).toBe('members');
		});
	});

	it('stops listening once unmounted', () => {
		const ref = iframeRefTo(providerWindow);
		const { result, unmount } = renderHook(() => useProviderCallBridge(ref));

		unmount();
		post(command({ command: 'set-chat-visible', visible: true }));

		expect(result.current.activePanel).toBe('members');
	});
});
