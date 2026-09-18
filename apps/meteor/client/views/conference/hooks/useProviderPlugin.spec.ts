import { act, renderHook } from '@testing-library/react';

import type { PluginParticipant } from './useProviderPlugin';
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
const onToggleParticipants = jest.fn();
const onLeave = jest.fn();

const render = (
	props: { chatVisible?: boolean; participantsVisible?: boolean; hasUnread?: boolean; conferenceUrl?: string | undefined } = {},
) =>
	renderHook(
		({ chatVisible, participantsVisible, hasUnread, conferenceUrl }) =>
			useProviderPlugin({
				conferenceUrl,
				chatVisible,
				participantsVisible,
				hasUnread,
				onToggleChat,
				onToggleParticipants,
				onLeave,
			}),
		{
			initialProps: {
				conferenceUrl: 'conferenceUrl' in props ? props.conferenceUrl : CONFERENCE_URL,
				chatVisible: props.chatVisible ?? false,
				participantsVisible: props.participantsVisible ?? false,
				hasUnread: props.hasUnread ?? false,
			},
		},
	);

/** What the plugin does: posts to the top window from a frame of its own. */
const fromPlugin = (data: Record<string, unknown>, { origin = PLUGIN_ORIGIN, source = pluginWindow } = {}) => {
	const event = new MessageEvent('message', { data, origin });
	// `source` is read-only on the prototype, and jsdom has no way to hand a constructor a foreign frame.
	Object.defineProperty(event, 'source', { value: source });
	// What the plugin says lands in state the panels render from, and a message is not a React event.
	act(() => {
		window.dispatchEvent(event);
	});
};

const message = (action: string, payload: Record<string, unknown> = {}) => ({ action: `rocketchat:videoconf/${action}`, ...payload });

const posted = () => pluginWindow.postMessage.mock.calls.map(([data]) => data);
const postedTo = () => pluginWindow.postMessage.mock.calls.map(([, targetOrigin]) => targetOrigin);

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

	// The one message that has to be answered. The plugin's buttons are already on screen by now, and every one
	// of them renders inactive and unbadged whatever this page is actually showing — so `ready` answers with the
	// state of each panel it stands in for.
	it('answers `ready` with the state of both panels and the unread', () => {
		render({ chatVisible: true, participantsVisible: true, hasUnread: true });

		fromPlugin(message('ready'));

		expect(posted()).toEqual([
			{ action: 'rocketchat:videoconf/chat-state', active: true },
			{ action: 'rocketchat:videoconf/participants-state', active: true },
			{ action: 'rocketchat:videoconf/chat-unread', unread: true },
		]);
	});

	// The provider's own people list is hidden in favour of this one, so its button has to reach ours.
	it('opens the people panel when the plugin button asks, and closes it when it asks again', () => {
		render();

		fromPlugin(message('toggle-participants', { active: true }));
		expect(onToggleParticipants).toHaveBeenCalledWith(true);

		fromPlugin(message('toggle-participants', { active: false }));
		expect(onToggleParticipants).toHaveBeenCalledWith(false);
	});

	it('follows the people panel however it was opened', () => {
		const { rerender } = render();
		fromPlugin(message('ready'));
		pluginWindow.postMessage.mockClear();

		rerender({ conferenceUrl: CONFERENCE_URL, chatVisible: false, participantsVisible: true, hasUnread: false });

		expect(posted()).toEqual([{ action: 'rocketchat:videoconf/participants-state', active: true }]);
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

		rerender({ conferenceUrl: CONFERENCE_URL, chatVisible: true, participantsVisible: false, hasUnread: false });

		expect(posted()).toEqual([{ action: 'rocketchat:videoconf/chat-state', active: true }]);
	});

	it('keeps the badge on the button in step with the unread', () => {
		const { rerender } = render();
		fromPlugin(message('ready'));
		pluginWindow.postMessage.mockClear();

		rerender({ conferenceUrl: CONFERENCE_URL, chatVisible: false, participantsVisible: false, hasUnread: true });

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

	/**
	 * `ready` carries the capability announcement, and it is the only thing standing between a control and a
	 * request the provider has nothing listening for. A control is offered for a feature named here and for no
	 * other, so what this set holds decides what the people panel shows.
	 */
	describe('what the provider says it can do', () => {
		it('knows nothing about the call until the plugin speaks', () => {
			const { result } = render();

			expect([...result.current.features]).toEqual([]);
			expect(result.current.participants).toEqual([]);
			expect(result.current.self).toBeUndefined();
		});

		it('holds exactly the features `ready` named', () => {
			const { result } = render();

			fromPlugin(message('ready', { features: ['mute', 'disconnect'] }));

			expect([...result.current.features]).toEqual(['mute', 'disconnect']);
		});

		// Either half may learn a message the other has never heard of, so an unknown name is not a reason to
		// distrust the rest of the announcement.
		it('ignores a feature this window has no control for', () => {
			const { result } = render();

			fromPlugin(message('ready', { features: ['mute', 'teleport'] }));

			expect([...result.current.features]).toEqual(['mute']);
		});
	});

	describe('who the provider has in the call', () => {
		const ada = { uuid: 'p-ada', displayName: 'Ada Lovelace', isHost: true, isMuted: true, can: { mute: true, disconnect: true } };

		it('keeps the roster it was last sent', () => {
			const { result } = render();

			fromPlugin(message('roster', { participants: [ada] }));

			expect(result.current.participants).toEqual([expect.objectContaining({ uuid: 'p-ada', displayName: 'Ada Lovelace' })]);
		});

		// The whole list arrives on every change, so whoever is not in the latest one has gone.
		it('replaces it rather than adding to it', () => {
			const { result } = render();

			fromPlugin(message('roster', { participants: [ada, { uuid: 'p-grace', displayName: 'Grace Hopper' }] }));
			fromPlugin(message('roster', { participants: [ada] }));

			expect(result.current.participants.map(({ uuid }) => uuid)).toEqual(['p-ada']);
		});

		// The panel asks every participant what may be done to them as it renders, and a plugin is free to send
		// a shape this window has not seen — a missing `can` would be a flag read off `undefined`.
		it('fills in every flag the plugin left out', () => {
			const { result } = render();

			fromPlugin(message('roster', { participants: [{ uuid: 'p-phone', displayName: '' }] }));

			expect(result.current.participants).toEqual<PluginParticipant[]>([
				{
					uuid: 'p-phone',
					displayName: '',
					isWaiting: false,
					isHost: false,
					isMuted: false,
					isClientMuted: false,
					isCameraMuted: false,
					isPresenting: false,
					isSpotlight: false,
					raisedHand: false,
					can: {
						control: false,
						mute: false,
						disconnect: false,
						transfer: false,
						spotlight: false,
						fecc: false,
						raiseHand: false,
						changeLayout: false,
					},
				},
			]);
		});

		// Every request names a participant by uuid, so one without it is a row of controls that could only ever
		// ask about nobody.
		it('drops a participant nothing could be asked about', () => {
			const { result } = render();

			fromPlugin(message('roster', { participants: [{ displayName: 'Nobody' }, ada] }));

			expect(result.current.participants.map(({ uuid }) => uuid)).toEqual(['p-ada']);
		});

		it('takes where the viewer stands in the call from `self`', () => {
			const { result } = render();

			fromPlugin(message('self', { participantUuid: 'p-me', isHost: true, canControl: true, micMuted: true }));

			expect(result.current.self).toEqual({
				participantUuid: 'p-me',
				micMuted: true,
				camMuted: false,
				clientMuted: false,
				isHost: true,
				canControl: true,
			});
		});

		// A plugin announces itself once per page, so a second `ready` is a provider page that reloaded — and
		// the call it was in before it did has nobody in it now.
		it('forgets the call it was showing when the provider page announces itself again', () => {
			const { result } = render();

			fromPlugin(message('roster', { participants: [ada] }));
			fromPlugin(message('self', { participantUuid: 'p-me' }));
			fromPlugin(message('ready', { features: ['roster'] }));

			expect(result.current.participants).toEqual([]);
			expect(result.current.self).toBeUndefined();
		});

		it('hears none of it from anywhere but the provider page', () => {
			const { result } = render();

			fromPlugin(message('roster', { participants: [ada] }), { origin: 'https://not-the-provider.example' });

			expect(result.current.participants).toEqual([]);
		});
	});

	describe('what it asks the provider to do', () => {
		const ready = () => {
			const view = render();
			fromPlugin(message('ready'));
			pluginWindow.postMessage.mockClear();
			return view;
		};

		// The names and the payloads are the contract; nothing comes back, so a mistyped one is a control that
		// silently does nothing.
		it('names each control the way the protocol names it', () => {
			const { result } = ready();
			const { actions } = result.current;

			actions.mute('p1', true);
			actions.muteVideo('p1', false);
			actions.admit('p1');
			actions.disconnect('p1');
			actions.spotlight('p1', true);
			actions.setRole('p1', 'host');

			expect(posted()).toEqual([
				{ action: 'rocketchat:videoconf/mute', participantUuid: 'p1', muted: true },
				{ action: 'rocketchat:videoconf/mute-video', participantUuid: 'p1', muted: false },
				{ action: 'rocketchat:videoconf/admit', participantUuid: 'p1' },
				{ action: 'rocketchat:videoconf/disconnect', participantUuid: 'p1' },
				{ action: 'rocketchat:videoconf/spotlight', participantUuid: 'p1', active: true },
				{ action: 'rocketchat:videoconf/set-role', participantUuid: 'p1', role: 'host' },
			]);
		});

		it('says nothing at all while there is no plugin to say it to', () => {
			const { result } = render();

			result.current.actions.disconnect('p1');

			expect(pluginWindow.postMessage).not.toHaveBeenCalled();
		});

		// hear a wildcard.
		// Every answer, not a counted few: what matters is that none of them is broadcast, however many `ready`
		// happens to draw out.
		it('answers the provider page at its own origin', () => {
			render();

			fromPlugin(message('ready'));

			expect(postedTo().length).toBeGreaterThan(0);
			expect(new Set(postedTo())).toEqual(new Set([PLUGIN_ORIGIN]));
		});

		// An opaque origin is the one case a concrete target cannot name, and a sandboxed plugin frame has one.
		it('falls back to a wildcard only for a frame whose origin cannot be named', () => {
			render();

			fromPlugin(message('ready'), { origin: 'null' });

			expect(postedTo().length).toBeGreaterThan(0);
			expect(new Set(postedTo())).toEqual(new Set(['*']));
		});
	});
});
