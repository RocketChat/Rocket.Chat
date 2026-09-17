import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * The message contract between this call window and a plugin running in the provider's own page.
 *
 * A provider reached by URL renders in this window's iframe, and its page can carry controls of its own — a
 * chat button in its in-meeting toolbar, a Leave button, a participant list with a host's controls on it. Those
 * controls know nothing about the panels beside the frame unless something tells them, which is what this
 * protocol is for: the provider's button becomes a remote control for the chat panel this page owns, this page
 * hears about a call the user left from inside the frame, and the people panel becomes a list of who is
 * actually in the call with the host's controls on each of them.
 *
 * Every message, in both directions, is `{ action: 'rocketchat:videoconf/<name>', ...payload }`. The namespace
 * is Rocket.Chat's rather than any provider's: the protocol is this window's, and any provider plugin that
 * speaks it gets the same behaviour. Pexip's `external-chat` plugin is the first to implement it.
 *
 * Unknown actions are ignored on both sides, so either half can learn a new message without breaking the other.
 *
 * | Direction | Action | Payload |
 * | --- | --- | --- |
 * | plugin → window | `ready` | `{ features: PluginFeature[] }` |
 * | plugin → window | `toggle-chat` | `{ active: boolean }` |
 * | plugin → window | `toggle-participants` | `{ active: boolean }` |
 * | plugin → window | `connected` | — |
 * | plugin → window | `disconnected` | `{ userInitiated: boolean }` |
 * | plugin → window | `self` | `PluginSelf` |
 * | plugin → window | `roster` | `{ participants: PluginParticipant[] }` |
 * | window → plugin | `chat-state` | `{ active: boolean }` |
 * | window → plugin | `participants-state` | `{ active: boolean }` |
 * | window → plugin | `chat-unread` | `{ unread: boolean }` |
 * | window → plugin | `mute` / `mute-video` | `{ participantUuid, muted: boolean }` |
 * | window → plugin | `admit` / `disconnect` | `{ participantUuid }` |
 * | window → plugin | `spotlight` | `{ participantUuid, active: boolean }` |
 * | window → plugin | `raise-hand` | `{ participantUuid, raised: boolean }` |
 * | window → plugin | `set-role` | `{ participantUuid, role: 'host' \| 'guest' }` |
 *
 * `transfer`, `dtmf` and `mute-all-guests` are part of the protocol and the provider's plugin answers them, but
 * this window sends none of the three: they are not features we support yet. The names stay in the vocabulary
 * so a plugin announcing them is understood rather than discarded, and so turning one on is a control and a
 * caller rather than a protocol change.
 *
 * `ready` is the capability announcement: nothing above is asked for unless the plugin named it, because a
 * provider that cannot carry out a request answers it with a refusal the user never asked for.
 */
const PLUGIN_NS = 'rocketchat:videoconf';

/** Everything a plugin may name in `ready`. A feature absent from that list is one this window never asks for. */
export const PLUGIN_FEATURES = [
	'chat',
	'participants',
	'roster',
	'self',
	'mute',
	'mute-video',
	'admit',
	'disconnect',
	'spotlight',
	'raise-hand',
	'set-role',
	'transfer',
	'dtmf',
	'mute-all-guests',
] as const;

export type PluginFeature = (typeof PLUGIN_FEATURES)[number];

/**
 * What the provider lets this participant's own controls do, straight from its per-participant flags.
 *
 * A control this refuses is a request that comes back 403, so these decide what is offered rather than what
 * happens when it is pressed.
 */
export type PluginParticipantPermissions = {
	control: boolean;
	mute: boolean;
	disconnect: boolean;
	transfer: boolean;
	spotlight: boolean;
	fecc: boolean;
	raiseHand: boolean;
	changeLayout: boolean;
};

/** Someone the provider has in the call, as its plugin reports them. */
export type PluginParticipant = {
	uuid: string;
	/** The only identity the protocol carries — no id is passed, and none is broadcast. */
	displayName: string;
	/** In the lobby, waiting to be admitted. */
	isWaiting: boolean;
	isHost: boolean;
	/** Muted by the conference, which is what a host's mute control does. */
	isMuted: boolean;
	/** Muted in their own client — what their own mic button did, and not a host's to undo. */
	isClientMuted: boolean;
	isCameraMuted: boolean;
	isPresenting: boolean;
	isSpotlight: boolean;
	raisedHand: boolean;
	can: PluginParticipantPermissions;
};

/** The viewer's own standing in the call, which is what decides whether they are offered the call-wide controls. */
export type PluginSelf = {
	participantUuid: string;
	micMuted: boolean;
	camMuted: boolean;
	clientMuted: boolean;
	isHost: boolean;
	canControl: boolean;
};

/** Everything this window can ask the provider to do. Each is a no-op until a plugin has said `ready`. */
export type ProviderPluginActions = {
	mute: (participantUuid: string, muted: boolean) => void;
	muteVideo: (participantUuid: string, muted: boolean) => void;
	admit: (participantUuid: string) => void;
	disconnect: (participantUuid: string) => void;
	spotlight: (participantUuid: string, active: boolean) => void;
	raiseHand: (participantUuid: string, raised: boolean) => void;
	setRole: (participantUuid: string, role: 'host' | 'guest') => void;
};

/** What the plugin makes of the call: who is in it, where the viewer stands, and what may be asked of either. */
export type ProviderPluginControls = {
	/** Empty until the plugin says `ready`, which is also what makes every control below unofferable. */
	features: ReadonlySet<PluginFeature>;
	self?: PluginSelf;
	participants: PluginParticipant[];
	actions: ProviderPluginActions;
};

type UseProviderPluginOptions = {
	/**
	 * The provider page in the iframe, and the origin its messages have to come from. Undefined for a provider
	 * that has no page of its own — nothing to talk to, and no origin to check a message against.
	 */
	conferenceUrl: string | undefined;
	/** Whether the chat panel is open, which is what the plugin's own control reflects. */
	chatVisible: boolean;
	/** The same for the people panel, which the provider's own list is hidden in favour of. */
	participantsVisible: boolean;
	/** Whether the chat has anything unread, which is what that control's badge reflects. */
	hasUnread: boolean;
	/** The plugin's chat control was used: open or close the chat panel. */
	onToggleChat: (active: boolean) => void;
	/** The plugin's people control was used: open or close the members panel. */
	onToggleParticipants: (active: boolean) => void;
	/**
	 * The user left the call from inside the provider's page. A provider with a page of its own keeps its own
	 * hang-up button, so this is the only way this window hears about it — see the `disconnected` case below
	 * for why only a deliberate leave gets here.
	 */
	onLeave: () => void;
};

const isPluginFeature = (value: unknown): value is PluginFeature => PLUGIN_FEATURES.includes(value as PluginFeature);

const toFeatures = (value: unknown): ReadonlySet<PluginFeature> => new Set(Array.isArray(value) ? value.filter(isPluginFeature) : []);

const toPermissions = (value: unknown): PluginParticipantPermissions => {
	const can = (value ?? {}) as Record<string, unknown>;

	return {
		control: can.control === true,
		mute: can.mute === true,
		disconnect: can.disconnect === true,
		transfer: can.transfer === true,
		spotlight: can.spotlight === true,
		fecc: can.fecc === true,
		raiseHand: can.raiseHand === true,
		changeLayout: can.changeLayout === true,
	};
};

// Every field is read from a frame this page cannot see into, so nothing is taken on trust: a missing `can`
// would otherwise be a control asking a flag of `undefined` as the panel renders.
const toParticipant = (value: unknown): PluginParticipant | undefined => {
	if (!value || typeof value !== 'object') {
		return undefined;
	}

	const { uuid, displayName, can, ...flags } = value as Record<string, unknown>;

	if (typeof uuid !== 'string' || !uuid) {
		return undefined;
	}

	return {
		uuid,
		displayName: typeof displayName === 'string' ? displayName : '',
		isWaiting: flags.isWaiting === true,
		isHost: flags.isHost === true,
		isMuted: flags.isMuted === true,
		isClientMuted: flags.isClientMuted === true,
		isCameraMuted: flags.isCameraMuted === true,
		isPresenting: flags.isPresenting === true,
		isSpotlight: flags.isSpotlight === true,
		raisedHand: flags.raisedHand === true,
		can: toPermissions(can),
	};
};

const toSelf = (value: Record<string, unknown>): PluginSelf | undefined => {
	if (typeof value.participantUuid !== 'string' || !value.participantUuid) {
		return undefined;
	}

	return {
		participantUuid: value.participantUuid,
		micMuted: value.micMuted === true,
		camMuted: value.camMuted === true,
		clientMuted: value.clientMuted === true,
		isHost: value.isHost === true,
		canControl: value.canControl === true,
	};
};

const NO_FEATURES: ReadonlySet<PluginFeature> = new Set();
const NO_PARTICIPANTS: PluginParticipant[] = [];

/**
 * Keeps a provider plugin's chat control and this page's chat panel saying the same thing, and hands back what
 * the plugin says about the call so the panels beside the frame can show it.
 *
 * Inert for a provider that posts none of these messages: a call that runs inside this page has no iframe at
 * all, and a provider page without a plugin never says `ready` — which leaves no features, nobody in the call,
 * and every action a no-op.
 */
export const useProviderPlugin = ({
	conferenceUrl,
	chatVisible,
	participantsVisible,
	hasUnread,
	onToggleChat,
	onToggleParticipants,
	onLeave,
}: UseProviderPluginOptions): ProviderPluginControls => {
	// The plugin's own frame, learned from the messages it sends. Not the iframe this page renders: a plugin may
	// run in a frame *inside* the provider's page — Pexip's does — and a message posted to the provider's own
	// window would never reach it there. So there is nothing to say until it has said `ready`.
	const pluginWindowRef = useRef<Window | null>(null);
	// Answered to the origin it spoke from, not a wildcard: `transfer` carries a conference PIN. A sandboxed
	// plugin frame reports the opaque `null`, which no concrete target origin can name, and only there is the
	// wildcard the sole way to reach it.
	const targetOriginRef = useRef('*');

	// Read inside the listener, which is bound once per call rather than on every panel toggle.
	const chatVisibleRef = useRef(chatVisible);
	chatVisibleRef.current = chatVisible;
	const participantsVisibleRef = useRef(participantsVisible);
	participantsVisibleRef.current = participantsVisible;
	const hasUnreadRef = useRef(hasUnread);
	hasUnreadRef.current = hasUnread;
	const onToggleChatRef = useRef(onToggleChat);
	onToggleChatRef.current = onToggleChat;
	const onToggleParticipantsRef = useRef(onToggleParticipants);
	onToggleParticipantsRef.current = onToggleParticipants;
	const onLeaveRef = useRef(onLeave);
	onLeaveRef.current = onLeave;

	// `disconnected` also arrives from a provider's own prejoin screen, where nobody has joined anything yet.
	// Reporting a leave from there would end a call for everyone still on their way into it.
	const wasConnectedRef = useRef(false);

	const [features, setFeatures] = useState<ReadonlySet<PluginFeature>>(NO_FEATURES);
	const [self, setSelf] = useState<PluginSelf>();
	const [participants, setParticipants] = useState<PluginParticipant[]>(NO_PARTICIPANTS);

	const postToPlugin = useCallback((action: string, data: Record<string, unknown> = {}) => {
		pluginWindowRef.current?.postMessage({ action: `${PLUGIN_NS}/${action}`, ...data }, targetOriginRef.current);
	}, []);

	useEffect(() => {
		let expectedOrigin: string;
		try {
			expectedOrigin = conferenceUrl ? new URL(conferenceUrl).origin : '';
		} catch {
			expectedOrigin = '';
		}

		// Nothing to listen for without a provider page to attribute the messages to. Listening anyway would
		// mean acting on `toggle-chat` from whatever else can reach this window.
		if (!expectedOrigin) {
			return;
		}

		const handleMessage = (event: MessageEvent) => {
			const data = event.data as Record<string, unknown> | null;
			if (!data || typeof data !== 'object') {
				return;
			}

			const { action } = data;
			if (typeof action !== 'string' || !action.startsWith(`${PLUGIN_NS}/`)) {
				return;
			}

			// The provider's own origin, or `null` for a sandboxed plugin frame — a sandbox without
			// `allow-same-origin` reports its origin as the opaque string rather than the document's.
			if (event.origin !== expectedOrigin && event.origin !== 'null') {
				return;
			}

			// Where to answer. Re-read from every message, so a reloaded provider page is answered in its new
			// frame rather than the one that went away with it.
			if (event.source) {
				pluginWindowRef.current = event.source as Window;
				targetOriginRef.current = event.origin === 'null' ? '*' : event.origin;
			}

			switch (action.slice(PLUGIN_NS.length + 1)) {
				case 'ready':
					// The capability announcement, and a fresh start: a plugin says it once per page, so a provider
					// page that reloaded is a new call session whose old roster describes nobody.
					setFeatures(toFeatures(data.features));
					setSelf(undefined);
					setParticipants(NO_PARTICIPANTS);

					// The plugin has no idea what this page is showing, and its control renders before it hears.
					// This is the one message that has to be answered, and both answers are part of it.
					postToPlugin('chat-state', { active: chatVisibleRef.current });
					postToPlugin('participants-state', { active: participantsVisibleRef.current });
					postToPlugin('chat-unread', { unread: hasUnreadRef.current });
					break;

				case 'connected':
					// Past the provider's own prejoin screen and into the call, which is also when the controls
					// that speak this protocol appear.
					wasConnectedRef.current = true;
					break;

				case 'disconnected':
					// Only a deliberate leave, and only from someone who had actually joined. An involuntary
					// drop is the provider's own to recover — its page offers to reconnect, and closing this
					// window out from under that would turn a blip into a departure.
					if (wasConnectedRef.current && data.userInitiated === true) {
						wasConnectedRef.current = false;
						onLeaveRef.current();
					}
					break;

				case 'toggle-participants':
					// Same shape as the chat's: the panel moves, and the effect below reports where it ended up.
					onToggleParticipantsRef.current(data.active === true);
					break;

				case 'toggle-chat':
					// The provider's chat control was used. Nothing is answered here: the panel moves, and the
					// effect below reports where it ended up — the same report every other way of moving it makes.
					onToggleChatRef.current(data.active === true);
					break;

				case 'self':
					setSelf(toSelf(data));
					break;

				case 'roster':
					// The whole list every time, so this replaces rather than merges — whoever is not in it left.
					setParticipants(Array.isArray(data.participants) ? data.participants.flatMap((entry) => toParticipant(entry) ?? []) : []);
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [conferenceUrl, postToPlugin]);

	// Pushed rather than answered, so every way of opening and closing the chat keeps the provider's control
	// honest: this page's own toggle in the top bar, the panel's close button, and the provider's control itself.
	useEffect(() => {
		postToPlugin('chat-state', { active: chatVisible });
	}, [chatVisible, postToPlugin]);

	useEffect(() => {
		postToPlugin('participants-state', { active: participantsVisible });
	}, [participantsVisible, postToPlugin]);

	useEffect(() => {
		postToPlugin('chat-unread', { unread: hasUnread });
	}, [hasUnread, postToPlugin]);

	const actions = useMemo(
		(): ProviderPluginActions => ({
			mute: (participantUuid, muted) => postToPlugin('mute', { participantUuid, muted }),
			muteVideo: (participantUuid, muted) => postToPlugin('mute-video', { participantUuid, muted }),
			admit: (participantUuid) => postToPlugin('admit', { participantUuid }),
			disconnect: (participantUuid) => postToPlugin('disconnect', { participantUuid }),
			spotlight: (participantUuid, active) => postToPlugin('spotlight', { participantUuid, active }),
			raiseHand: (participantUuid, raised) => postToPlugin('raise-hand', { participantUuid, raised }),
			setRole: (participantUuid, role) => postToPlugin('set-role', { participantUuid, role }),
		}),
		[postToPlugin],
	);

	return { features, self, participants, actions };
};
