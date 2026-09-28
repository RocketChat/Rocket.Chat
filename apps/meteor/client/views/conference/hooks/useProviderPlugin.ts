import type {
	PluginFeature,
	PluginParticipant,
	PluginParticipantPermissions,
	PluginSelf,
	ProviderPluginActions,
	ProviderPluginControls,
} from '@rocket.chat/ui-conference';
import { PLUGIN_FEATURES } from '@rocket.chat/ui-conference';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The namespace every message of this protocol carries, in both directions.
 *
 * The contract itself — who sends what, and what each message means — is in
 * [the feature doc](../../../../../../docs/features/video-conference-persistent-chat/README.md).
 */
const PLUGIN_NS = 'rocketchat:videoconf';

/**
 * Pexip's plugin speaks a namespace and a vocabulary of its own, and is not ours to change.
 *
 * So it is translated on the way in and out rather than adapted to: everything below works in the protocol
 * above, and the two `pexip` branches are the whole of what knows there is another one.
 */
const PEXIP_NS = 'pexip:plugin:external-chat';

type PluginDialect = 'rocketchat' | 'pexip';

/** Pexip announces nothing about itself, so what its plugin can do is what its plugin has always done. */
const PEXIP_FEATURES: ReadonlySet<PluginFeature> = new Set<PluginFeature>(['chat', 'dial-out']);

/** The namespace a message arrived in, and the bare action under it. */
const readAction = (action: string): { dialect: PluginDialect; name: string } | undefined => {
	if (action.startsWith(`${PLUGIN_NS}/`)) {
		return { dialect: 'rocketchat', name: action.slice(PLUGIN_NS.length + 1) };
	}

	if (action.startsWith(`${PEXIP_NS}/`)) {
		return { dialect: 'pexip', name: action.slice(PEXIP_NS.length + 1) };
	}

	return undefined;
};

/** What each thing the window says is called, and carries, in the dialect being spoken. */
const outbound = {
	rocketchat: {
		'chat-state': (active: boolean) => ({ action: 'chat-state', data: { active } }),
		'chat-unread': (unread: boolean) => ({ action: 'chat-unread', data: { unread } }),
		'dial-out': (destination: string) => ({ action: 'dial-out', data: { destination } }),
	},
	pexip: {
		'chat-state': (active: boolean) => ({ action: 'toggle-chat-button-state', data: { active } }),
		'chat-unread': (unread: boolean) => ({ action: 'toggle-chat-badge', data: { visible: unread } }),
		'dial-out': (destination: string) => ({
			action: 'dial-out',
			data: { role: 'GUEST', destination, protocol: 'auto', call_type: 'audio' },
		}),
	},
} as const;

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
	/**
	 * The call ended without the provider saying whether the user meant it.
	 *
	 * Pexip reports a disconnection and nothing else, so neither reading is safe to act on alone — see the
	 * `disconnected` case below. A provider that says which it was reaches `onLeave` instead.
	 */
	onDropped?: () => void;
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
	onDropped,
}: UseProviderPluginOptions): ProviderPluginControls => {
	// Learned from the messages it sends, not from the iframe this page renders: a plugin may run in a frame
	// *inside* the provider's page, where a message posted to the provider's own window would never reach it.
	const pluginWindowRef = useRef<Window | null>(null);
	// Answered to the origin it spoke from, since `transfer` carries a conference PIN. A sandboxed frame reports
	// the opaque `null`, which no concrete target origin can name, and only there is the wildcard the only way.
	const targetOriginRef = useRef('*');
	// Answered in whatever the plugin spoke first, so nothing has to be configured to match it.
	const dialectRef = useRef<PluginDialect>('rocketchat');

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
	const onDroppedRef = useRef(onDropped);
	onDroppedRef.current = onDropped;

	// `disconnected` also arrives from a prejoin screen, where nobody has joined: reporting a leave from there
	// would end the call for everyone still on their way into it.
	const wasConnectedRef = useRef(false);

	// Held in a ref like everything else the listener reads, so a language change does not rebind it.
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();
	const reportDialOutRef = useRef<(dialled: boolean, detail: string) => void>(() => undefined);
	reportDialOutRef.current = (dialled, detail) => {
		if (dialled) {
			dispatchToastMessage({ type: 'success', message: t('Calling__roomName__', { roomName: detail }) });
			return;
		}

		dispatchToastMessage({ type: 'error', message: detail || t('Error') });
	};

	const [features, setFeatures] = useState<ReadonlySet<PluginFeature>>(NO_FEATURES);
	const [self, setSelf] = useState<PluginSelf>();
	const [participants, setParticipants] = useState<PluginParticipant[]>(NO_PARTICIPANTS);

	const postToPlugin = useCallback((action: string, data: Record<string, unknown> = {}) => {
		const ns = dialectRef.current === 'pexip' ? PEXIP_NS : PLUGIN_NS;
		pluginWindowRef.current?.postMessage({ action: `${ns}/${action}`, ...data }, targetOriginRef.current);
	}, []);

	/** The three things the window tells a plugin, each said the way the dialect in use says it. */
	const say = useCallback(
		(key: keyof (typeof outbound)['rocketchat'], value: boolean | string) => {
			const build = outbound[dialectRef.current][key] as (value: boolean | string) => { action: string; data: Record<string, unknown> };
			const { action, data } = build(value);
			postToPlugin(action, data);
		},
		[postToPlugin],
	);

	useEffect(() => {
		let expectedOrigin: string;
		try {
			expectedOrigin = conferenceUrl ? new URL(conferenceUrl).origin : '';
		} catch {
			expectedOrigin = '';
		}

		// Without a page to attribute messages to, listening means acting on whatever else can reach this window.
		if (!expectedOrigin) {
			return;
		}

		const handleMessage = (event: MessageEvent) => {
			const data = event.data as Record<string, unknown> | null;
			if (!data || typeof data !== 'object') {
				return;
			}

			const { action } = data;
			if (typeof action !== 'string') {
				return;
			}

			const spoken = readAction(action);
			if (!spoken) {
				return;
			}

			// A sandbox without `allow-same-origin` reports the opaque `null` rather than its document's origin.
			if (event.origin !== expectedOrigin && event.origin !== 'null') {
				return;
			}

			// Re-read every message, so a reloaded page is answered in its new frame rather than the one that went.
			if (event.source) {
				pluginWindowRef.current = event.source as Window;
				targetOriginRef.current = event.origin === 'null' ? '*' : event.origin;
				dialectRef.current = spoken.dialect;
			}

			switch (spoken.name) {
				case 'ready':
					// Said once per page, so a reload is a new session whose old roster describes nobody.
					setFeatures(spoken.dialect === 'pexip' ? PEXIP_FEATURES : toFeatures(data.features));
					setSelf(undefined);
					setParticipants(NO_PARTICIPANTS);

					// The plugin's control renders before it hears anything, so this is the one message that must
					// be answered.
					say('chat-state', chatVisibleRef.current);
					if (spoken.dialect === 'rocketchat') {
						postToPlugin('participants-state', { active: participantsVisibleRef.current });
					}
					say('chat-unread', hasUnreadRef.current);
					break;

				case 'connected':
					// Past the prejoin screen and into the call, which is when the controls appear.
					wasConnectedRef.current = true;
					break;

				case 'disconnected':
					// Nothing from a prejoin screen, where nobody has joined: reporting a leave from there would
					// end the call for everyone still on their way into it.
					if (!wasConnectedRef.current) {
						break;
					}

					// A deliberate leave is acted on; an involuntary drop is the provider's to recover, and closing
					// the window under it turns a blip into a departure.
					if (data.userInitiated === true) {
						wasConnectedRef.current = false;
						onLeaveRef.current();
						break;
					}

					// Pexip says only that the connection ended, so neither reading is safe on its own — that goes
					// to whoever can ask the reader which it was.
					if (spoken.dialect === 'pexip') {
						wasConnectedRef.current = false;
						onDroppedRef.current?.();
					}
					break;

				case 'toggle-participants':
					onToggleParticipantsRef.current(data.active === true);
					break;

				case 'toggle-chat':
					// Nothing is answered here: the panel moves, and the effect below reports where it ended up.
					onToggleChatRef.current(data.active === true);
					break;

				case 'self':
					setSelf(toSelf(data));
					break;

				// A number is dialled into the call rather than invited to it, so nothing appears anywhere to say
				// it worked — the provider's answer is the only account of it there is.
				case 'dial-out-success':
					reportDialOutRef.current(true, typeof data.displayName === 'string' ? data.displayName : '');
					break;

				case 'dial-out-error':
					reportDialOutRef.current(false, typeof data.message === 'string' ? data.message : '');
					break;

				case 'roster':
					// The whole list every time: whoever is not in it left.
					setParticipants(Array.isArray(data.participants) ? data.participants.flatMap((entry) => toParticipant(entry) ?? []) : []);
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [conferenceUrl, postToPlugin, say]);

	// Pushed rather than answered, so every way of moving the panel keeps the provider's control honest.
	useEffect(() => {
		say('chat-state', chatVisible);
	}, [chatVisible, say]);

	// Only the dialect that has a people panel to keep in step; Pexip's plugin has no such control to tell.
	useEffect(() => {
		if (dialectRef.current === 'rocketchat') {
			postToPlugin('participants-state', { active: participantsVisible });
		}
	}, [participantsVisible, postToPlugin]);

	useEffect(() => {
		say('chat-unread', hasUnread);
	}, [hasUnread, say]);

	const actions = useMemo(
		(): ProviderPluginActions => ({
			mute: (participantUuid, muted) => postToPlugin('mute', { participantUuid, muted }),
			muteVideo: (participantUuid, muted) => postToPlugin('mute-video', { participantUuid, muted }),
			admit: (participantUuid) => postToPlugin('admit', { participantUuid }),
			disconnect: (participantUuid) => postToPlugin('disconnect', { participantUuid }),
			spotlight: (participantUuid, active) => postToPlugin('spotlight', { participantUuid, active }),
			raiseHand: (participantUuid, raised) => postToPlugin('raise-hand', { participantUuid, raised }),
			setRole: (participantUuid, role) => postToPlugin('set-role', { participantUuid, role }),
			dialOut: (destination) => say('dial-out', destination),
		}),
		[postToPlugin, say],
	);

	return { features, self, participants, actions };
};
