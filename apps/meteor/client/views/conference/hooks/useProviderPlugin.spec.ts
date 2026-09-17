import { renderHook } from '@testing-library/react';

import { useProviderPlugin } from './useProviderPlugin';

/**
 * The bridge to a plugin in the provider's own page, which is a chat control in someone else's UI. Everything
 * here is about the two staying in step: the control renders before the plugin knows what this page is showing,
 * the panel can be opened and closed by three different things, and the messages arrive from a frame this page
 * cannot see into — so what is trusted, and what is answered, is the whole of it.
 *
 * The provider is incidental to all of it: these use a Pexip-shaped URL because Pexip's plugin is the first to
 * speak the protocol, and a Jitsi one implementing the same actions would pass the same cases.
 */
const CONFERENCE_URL = 'https://provider.example/webapp3/m/call-id';
const PLUGIN_ORIGIN = 'https://provider.example';

const pluginWindow = { postMessage: jest.fn() };

const onToggleChat = jest.fn();
const onLeave = jest.fn();

const render = (props: { chatVisible?: boolean; hasUnread?: boolean; conferenceUrl?: string | undefined } = {}) =>
	renderHook(
		({ chatVisible, hasUnread, conferenceUrl }) => useProviderPlugin({ conferenceUrl, chatVisible, hasUnread, onToggleChat, onLeave }),
		{
			initialProps: {
				conferenceUrl: 'conferenceUrl' in props ? props.conferenceUrl : CONFERENCE_URL,
				chatVisible: props.chatVisible ?? false,
				hasUnread: props.hasUnread ?? false,
			},
		},
	);

/** What the plugin does: posts to the top window from a frame of its own. */
const fromPlugin = (data: Record<string, unknown>, { origin = PLUGIN_ORIGIN, source = pluginWindow } = {}) => {
	const event = new MessageEvent('message', { data, origin });
	// `source` is read-only on the prototype, and jsdom has no way to hand a constructor a foreign frame.
	Object.defineProperty(event, 'source', { value: source });
	window.dispatchEvent(event);
};

const message = (action: string, payload: Record<string, unknown> = {}) => ({ action: `rocketchat:videoconf/${action}`, ...payload });

const posted = () => pluginWindow.postMessage.mock.calls.map(([data]) => data);

beforeEach(() => {
	pluginWindow.postMessage.mockClear();
	onToggleChat.mockClear();
	onLeave.mockClear();
});

describe('useProviderPlugin', () => {
	// There is nowhere to post before the plugin has spoken: it lives in a frame inside the provider's page,
	// which this page holds no reference to.
	it('says nothing until the plugin does', () => {
		render({ chatVisible: true, hasUnread: true });

		expect(pluginWindow.postMessage).not.toHaveBeenCalled();
	});

	// The one message that has to be answered. The plugin's button is already on screen by now, and it renders
	// inactive and unbadged whatever this page is actually showing.
	it('answers `ready` with the state of the panel and its unread', () => {
		render({ chatVisible: true, hasUnread: true });

		fromPlugin(message('ready'));

		expect(posted()).toEqual([
			{ action: 'rocketchat:videoconf/chat-state', active: true },
			{ action: 'rocketchat:videoconf/chat-unread', unread: true },
		]);
	});

	it('opens the chat when the plugin button asks, and closes it when it asks again', () => {
		render();

		fromPlugin(message('toggle-chat', { active: true }));
		expect(onToggleChat).toHaveBeenCalledWith(true);

		fromPlugin(message('toggle-chat', { active: false }));
		expect(onToggleChat).toHaveBeenLastCalledWith(false);
	});

	// The panel has three ways to open and close — this page's own toggle, the panel's close button, and the
	// plugin's — so the button follows the panel rather than the click that moved it.
	it('follows the panel however it was opened', () => {
		const { rerender } = render();
		fromPlugin(message('ready'));
		pluginWindow.postMessage.mockClear();

		rerender({ conferenceUrl: CONFERENCE_URL, chatVisible: true, hasUnread: false });

		expect(posted()).toEqual([{ action: 'rocketchat:videoconf/chat-state', active: true }]);
	});

	it('keeps the badge on the button in step with the unread', () => {
		const { rerender } = render();
		fromPlugin(message('ready'));
		pluginWindow.postMessage.mockClear();

		rerender({ conferenceUrl: CONFERENCE_URL, chatVisible: false, hasUnread: true });

		expect(posted()).toEqual([{ action: 'rocketchat:videoconf/chat-unread', unread: true }]);
	});

	describe('what it refuses to act on', () => {
		it('a message from anywhere but the provider page', () => {
			render();

			fromPlugin(message('toggle-chat', { active: true }), { origin: 'https://not-the-provider.example' });

			expect(onToggleChat).not.toHaveBeenCalled();
		});

		// A plugin frame may be sandboxed, and then its origin is the opaque string rather than the document's.
		it('but not the plugin frame, whose origin is opaque', () => {
			render();

			fromPlugin(message('toggle-chat', { active: true }), { origin: 'null' });

			expect(onToggleChat).toHaveBeenCalledWith(true);
		});

		it('anything that is not one of the plugin actions', () => {
			render();

			fromPlugin({ action: 'toggle-chat', active: true });
			fromPlugin({ action: 'pexip:plugin:external-chat/toggle-chat', active: true });
			fromPlugin({ hello: 'there' });

			expect(onToggleChat).not.toHaveBeenCalled();
		});

		// A call that runs in this page has no iframe and no plugin. With no provider origin there is nothing to
		// check a message against, so nothing is trusted.
		it('anything at all, for a provider with no page of its own', () => {
			render({ conferenceUrl: undefined });

			fromPlugin(message('toggle-chat', { active: true }));
			fromPlugin(message('ready'));

			expect(onToggleChat).not.toHaveBeenCalled();
			expect(pluginWindow.postMessage).not.toHaveBeenCalled();
		});
	});

	describe('leaving from inside the provider page', () => {
		it('reports a leave the user chose', () => {
			render();

			fromPlugin(message('connected'));
			fromPlugin(message('disconnected', { userInitiated: true }));

			expect(onLeave).toHaveBeenCalledTimes(1);
		});

		// The provider's page offers to reconnect, and closing this window out from under that would turn a
		// blip into a departure — and end the call for everyone else once the roster empties.
		it('leaves a dropped connection to the provider to recover', () => {
			render();

			fromPlugin(message('connected'));
			fromPlugin(message('disconnected', { userInitiated: false }));

			expect(onLeave).not.toHaveBeenCalled();
		});

		// A provider's prejoin screen reports a user-initiated disconnect too, and nobody has joined anything
		// from there: reporting a leave would schedule the empty-call sweep on a call still filling up.
		it('says nothing for someone who never got past the preflight', () => {
			render();

			fromPlugin(message('disconnected', { userInitiated: true }));

			expect(onLeave).not.toHaveBeenCalled();
		});

		it('reports it once, however many times the page hears about it', () => {
			render();

			fromPlugin(message('connected'));
			fromPlugin(message('disconnected', { userInitiated: true }));
			fromPlugin(message('disconnected', { userInitiated: true }));

			expect(onLeave).toHaveBeenCalledTimes(1);
		});
	});
});
