import type {
	PluginFeature,
	PluginParticipant,
	PluginParticipantPermissions,
	PluginSelf,
	ProviderPluginActions,
	ProviderPluginControls,
} from '@rocket.chat/ui-conference';
import { PLUGIN_FEATURES } from '@rocket.chat/ui-conference';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * The namespace every message of this protocol carries, in both directions.
 *
 * The contract itself — who sends what, and what each message means — is in
 * [the feature doc](../../../../../../docs/features/video-conference-persistent-chat/README.md).
 */
const PLUGIN_NS = 'rocketchat:videoconf';

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
