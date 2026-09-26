/* One story harness; the wrappers below are three lines each and read as a unit. */
/* eslint-disable react/no-multi-comp */
import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { VIDEO_CONF_RINGING_WINDOW_MS } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { VideoConfContextValue } from '@rocket.chat/ui-video-conf';
import { VideoConfContext } from '@rocket.chat/ui-video-conf';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { action } from 'storybook/actions';

import { storybookI18n } from './i18n';
import { buildConferenceMember } from './testFixtures';
import type { ConferenceContextValue } from '../context/ConferenceContext';
import { ConferenceContext, defaultConferenceContextValue } from '../context/ConferenceContext';
import type { OngoingCallsContextValue } from '../context/OngoingCallsContext';
import { OngoingCallsContext, defaultOngoingCallsContextValue } from '../context/OngoingCallsContext';
import type { ConferenceMember } from '../context/definitions';
import { callPreferencesStorageKey } from '../hooks/useCallDevicesInitialState';
import type { PluginFeature, PluginParticipant, ProviderPluginControls } from '../lib/providerPlugin';
import { PLUGIN_FEATURES } from '../lib/providerPlugin';
import ConferenceViewport from '../views/ConferenceViewport';

/** Who `withJohnDoe` logs in as, so the context says the same thing the app root does. */
export const JOHN_DOE_ID = 'john.doe';

export const conferenceAppRoot = () => mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true);

type Builder = ReturnType<typeof mockAppRoot>;

/** Replaces the video-conf actions, which `mockAppRoot` makes throw, with logged ones. */
const CallActions = ({ children }: { children: ReactNode }) => {
	const parent = useContext(VideoConfContext);

	const value = useMemo(
		(): VideoConfContextValue => ({
			...(parent as VideoConfContextValue),
			joinCall: action('joinCall'),
			acceptCall: action('acceptCall'),
			dismissCall: action('dismissCall'),
			rejectIncomingCall: action('rejectIncomingCall'),
			startCall: action('startCall'),
			setPreferences: action('setPreferences'),
		}),
		[parent],
	);

	return <VideoConfContext.Provider value={value}>{children}</VideoConfContext.Provider>;
};

export const withCallProviders = (builder: Builder): Decorator => {
	const Providers = builder.build();

	// eslint-disable-next-line react/display-name
	return (Story) => (
		<Providers>
			{/* Inside `Providers`, which installs an i18next instance with no resources: the nearest one wins. */}
			<I18nextProvider i18n={storybookI18n}>
				<CallActions>
					<Story />
				</CallActions>
			</I18nextProvider>
		</Providers>
	);
};

/** A conference as a story states it: each group filled in only where it differs from "not yet". */
export type ConferenceFixture = Omit<Partial<ConferenceContextValue>, 'call' | 'room' | 'session' | 'actions' | 'slots' | 'viewer'> & {
	call?: Partial<ConferenceContextValue['call']>;
	room?: Partial<ConferenceContextValue['room']>;
	session?: Partial<ConferenceContextValue['session']>;
	actions?: Partial<ConferenceContextValue['actions']>;
	slots?: Partial<ConferenceContextValue['slots']>;
	viewer?: Partial<ConferenceContextValue['viewer']>;
};

/** A conference, told rather than fetched: every action logs. */
export const buildConferenceContext = ({
	call,
	room,
	session,
	actions,
	slots,
	viewer,
	...rest
}: ConferenceFixture = {}): ConferenceContextValue => ({
	...defaultConferenceContextValue,
	callId: 'call-id',
	...rest,
	call: { ...defaultConferenceContextValue.call, ...call },
	room: { ...defaultConferenceContextValue.room, loading: false, ...room },
	session: { ...defaultConferenceContextValue.session, ...session },
	actions: {
		join: action('join'),
		leave: action('leave'),
		ringMember: async (memberId) => action('ringMember')(memberId),
		shareChat: async (mode) => action('shareChat')(mode),
		addParticipants: async (users, ring) => {
			action('addParticipants')(users, ring);
			return { added: users.length };
		},
		...actions,
	},
	slots: {
		renderMemberStatus: () => <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: '#2de0a5' }} />,
		...slots,
	},
	viewer: { uid: JOHN_DOE_ID, useRealName: false, displayAvatars: true, canRingUsers: true, ...viewer },
});

export const withConference = (value?: ConferenceFixture): Decorator => {
	const conference = buildConferenceContext(value);

	// eslint-disable-next-line react/display-name
	return (Story) => (
		<ConferenceContext.Provider value={conference}>
			<Story />
		</ConferenceContext.Provider>
	);
};

const LiveConference = ({ value, children }: { value: ConferenceFixture; children: ReactNode }) => {
	const ringingAt = useLiveRingingAt();

	const conference = useMemo(
		() =>
			buildConferenceContext({
				...value,
				call: {
					...value.call,
					// Only the ones already stamped, or every row in the panel would claim a ring.
					members: (value.call?.members ?? []).map((member) => (member.ringingAt ? { ...member, ringingAt } : member)),
				},
			}),
		[value, ringingAt],
	);

	return <ConferenceContext.Provider value={conference}>{children}</ConferenceContext.Provider>;
};

/** A conference whose rings stay rings — see {@link useLiveRingingAt}. */
export const withLiveConference =
	(value: ConferenceFixture): Decorator =>
	// eslint-disable-next-line react/display-name
	(Story) => (
		<LiveConference value={value}>
			<Story />
		</LiveConference>
	);

/** What a story says about the navbar's list of calls. */
export type OngoingCallsFixture = NonNullable<Parameters<typeof buildOngoingCallsContext>[0]>;

/** The same, for the navbar's list of calls. */
export const buildOngoingCallsContext = ({
	audibleCalls = [],
	silencedCalls = [],
	silenceCall = action('silenceCall'),
	...value
}: Partial<OngoingCallsContextValue> & {
	/** Calls this client is audibly ringing for — the only ones offering Silence. */
	audibleCalls?: string[];
	/** Calls this client was asked to stop making noise about. */
	silencedCalls?: string[];
	silenceCall?: (callId: string) => void;
} = {}): OngoingCallsContextValue => ({
	...defaultOngoingCallsContextValue,
	joinCall: action('joinCall'),
	declineCall: action('declineCall'),
	callRing: (callId) => ({
		audible: audibleCalls.includes(callId),
		silenced: silencedCalls.includes(callId),
		silence: () => silenceCall(callId),
	}),
	// Pinned to UTC: snapshots read this fixture, and the host's zone would record the reviewer's hour.
	formatTime: (date) => date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }),
	...value,
});

export const withOngoingCalls = (value?: OngoingCallsFixture): Decorator => {
	const calls = buildOngoingCallsContext(value);

	// eslint-disable-next-line react/display-name
	return (Story) => (
		<OngoingCallsContext.Provider value={calls}>
			<Story />
		</OngoingCallsContext.Provider>
	);
};

const LiveOngoingCalls = ({ value, children }: { value: OngoingCallsFixture; children: ReactNode }) => {
	const ringingAt = useLiveRingingAt();

	const calls = useMemo(
		() =>
			buildOngoingCallsContext({
				...value,
				// Only the ringing bucket, or a row would claim a ring that is not this story's subject.
				ringing: (value.ringing ?? []).map((call) => ({ ...call, ringingAt })),
			}),
		[value, ringingAt],
	);

	return <OngoingCallsContext.Provider value={calls}>{children}</OngoingCallsContext.Provider>;
};

/** The same, with every ring in the list kept ringing — see {@link useLiveRingingAt}. */
export const withLiveOngoingCalls =
	(value: OngoingCallsFixture): Decorator =>
	// eslint-disable-next-line react/display-name
	(Story) => (
		<LiveOngoingCalls value={value}>
			<Story />
		</LiveOngoingCalls>
	);

/** The same providers inside `ConferenceViewport`, which carries the window's palette and modal region. */
export const withConferenceWindow = (builder: Builder): Decorator => {
	const withProviders = withCallProviders(builder);

	return (Story, context) =>
		withProviders(
			() => (
				<ConferenceViewport>
					<Story />
				</ConferenceViewport>
			),
			context,
		);
};

// Kept per account, and every story here is John Doe — see `conferenceAppRoot`.
const CALL_PREFERENCES_KEY = callPreferencesStorageKey('john.doe');

/** Seeds the remembered call preferences, which the preflight reads from local storage rather than from props. */
export const storeCallPreferences = (preferences: { mic?: boolean; cam?: boolean; ring?: boolean }) => () => {
	const previous = localStorage.getItem(CALL_PREFERENCES_KEY);

	localStorage.setItem(
		CALL_PREFERENCES_KEY,
		JSON.stringify({ mic: true, cam: false, ring: true, blurLevel: 'none', videoQuality: 'auto', ...preferences }),
	);

	return () => {
		if (previous === null) {
			localStorage.removeItem(CALL_PREFERENCES_KEY);
			return;
		}
		localStorage.setItem(CALL_PREFERENCES_KEY, previous);
	};
};

/** Re-stamped at a third of the ring window, so a ring is renewed well before it would lapse. */
const RING_RESTAMP_MS = VIDEO_CONF_RINGING_WINDOW_MS / 3;

/**
 * A ring that stays a ring.
 *
 * `isRingingVideoConferenceMember` answers no once `ringingAt` is `VIDEO_CONF_RINGING_WINDOW_MS` old, so a
 * fixture stamped at module load stops ringing that long into the session. This moves the moment forward.
 */
export const useLiveRingingAt = (): Date => {
	const [ringingAt, setRingingAt] = useState(() => new Date());

	useEffect(() => {
		const interval = setInterval(() => setRingingAt(new Date()), RING_RESTAMP_MS);

		return () => clearInterval(interval);
	}, []);

	return ringingAt;
};

const LiveRing = ({ children }: { children: (ringingAt: Date) => ReactNode }) => <>{children(useLiveRingingAt())}</>;

/**
 * Re-stamps a story's rings with {@link useLiveRingingAt}. `restamp` says which args are rings, and must leave
 * whatever has no `ringingAt` alone: these sit on a whole file's `meta`.
 */
export const withLiveRings =
	// Unparameterized `Decorator`: a `Decorator<TArgs>` alongside plain ones in `meta.decorators` widens the
	// array to a union `composeStories` cannot read the stories out of.
	<TArgs,>(restamp: (args: TArgs, ringingAt: Date) => Partial<TArgs>): Decorator =>
		// eslint-disable-next-line react/display-name
		(Story, { args }) => (
			// Spread: `args` on a story replaces rather than merges.
			<LiveRing>{(ringingAt) => <Story args={{ ...args, ...restamp(args as unknown as TArgs, ringingAt) }} />}</LiveRing>
		);

/** Somewhere dark and call-shaped to put the chrome, which is only ever seen against a conference. */
export const CallSurface = ({ children, height = 'auto' }: { children: ReactNode; height?: string }) => (
	<div style={{ backgroundColor: '#1f2329', borderRadius: 4, display: 'flex', flexDirection: 'column', height, overflow: 'hidden' }}>
		{children}
	</div>
);

export const allCapabilities: VideoConferenceCapabilities = { mic: true, cam: true, title: true };

/** A provider that runs the call in this window — the only one the preflight offers device choices for. */
export const embeddedCapabilities: VideoConferenceCapabilities = { ...allCapabilities, embedded: true };

/**
 * Media devices, since Storybook has none. `getUserMedia` is deliberately absent, so a preview stays a placeholder
 * instead of asking Storybook for a camera.
 */
export const withFakeDevices = () => () => {
	const previous = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
	const devices = [
		{ deviceId: 'default', kind: 'audioinput', label: 'MacBook Pro Microphone', groupId: 'built-in' },
		{ deviceId: 'yeti', kind: 'audioinput', label: 'Yeti Stereo Microphone', groupId: 'usb' },
		{ deviceId: 'default', kind: 'audiooutput', label: 'MacBook Pro Speakers', groupId: 'built-in' },
		{ deviceId: 'facetime', kind: 'videoinput', label: 'FaceTime HD Camera', groupId: 'built-in' },
	] as unknown as MediaDeviceInfo[];

	Object.defineProperty(navigator, 'mediaDevices', {
		configurable: true,
		value: { enumerateDevices: async () => devices, addEventListener: () => undefined, removeEventListener: () => undefined },
	});

	// Put the real thing back, so one story's devices don't decide the next one's.
	return () => {
		if (previous) {
			Object.defineProperty(navigator, 'mediaDevices', previous);
			return;
		}
		Reflect.deleteProperty(navigator, 'mediaDevices');
	};
};

/** The four states a member of a call can be in. `ringing` needs {@link withLiveRings} to stay one. */
export const members: Record<'joined' | 'ringing' | 'declined' | 'left', ConferenceMember> = {
	joined: buildConferenceMember({ _id: 'joined', name: 'Ada Lovelace', username: 'ada' }),
	ringing: buildConferenceMember({ _id: 'ringing', name: 'Grace Hopper', username: 'grace', joined: false, ringingAt: new Date() }),
	declined: buildConferenceMember({
		_id: 'declined',
		name: 'Alan Turing',
		username: 'alan',
		joined: false,
		declined: true,
		declinedAt: new Date(),
	}),
	// Left, so they *did* join — `joined` records that they were there and never goes back.
	left: buildConferenceMember({ _id: 'left', name: 'Katherine Johnson', username: 'katherine', leftAt: new Date() }),
};

/**
 * Someone the provider has in the call, allowed everything by default — the stories that are about a control
 * being withheld say which flag they took away.
 */
export const buildCallParticipant = (overrides: Partial<PluginParticipant> & Pick<PluginParticipant, 'uuid'>): PluginParticipant => ({
	displayName: overrides.uuid,
	isWaiting: false,
	isHost: false,
	isMuted: false,
	isClientMuted: false,
	isCameraMuted: false,
	isPresenting: false,
	isSpotlight: false,
	raisedHand: false,
	...overrides,
	can: {
		control: true,
		mute: true,
		disconnect: true,
		transfer: true,
		spotlight: true,
		fecc: true,
		raiseHand: true,
		changeLayout: true,
		...overrides.can,
	},
});

/**
 * A provider plugin that announces everything and logs what it is asked to do.
 *
 * The features are the whole vocabulary because a story showing a control is a story about the control, not
 * about the announcement — the stories of a provider that announces less pass their own set.
 */
export const speakingProvider = ({
	participants = [],
	features = [...PLUGIN_FEATURES],
	self,
}: Partial<Pick<ProviderPluginControls, 'participants' | 'self'>> & { features?: PluginFeature[] } = {}): ProviderPluginControls => ({
	features: new Set(features),
	participants,
	self,
	actions: {
		mute: action('mute'),
		muteVideo: action('muteVideo'),
		admit: action('admit'),
		disconnect: action('disconnect'),
		spotlight: action('spotlight'),
		setRole: action('setRole'),
		raiseHand: action('raiseHand'),
	},
});

/**
 * The two shapes a phone gives a call. Landscape is the awkward one: 852px is past the `md` breakpoint, so it
 * measures as a desktop while being far too short to stack anything.
 */
export const PHONE_VIEWPORTS = {
	phonePortrait: { name: 'Phone — portrait', styles: { width: '393px', height: '852px' } },
	phoneLandscape: { name: 'Phone — landscape', styles: { width: '852px', height: '393px' } },
} as const;

/** Pins a story to one of the phone shapes above, toolbar still free to change it. */
export const onPhone = (value: keyof typeof PHONE_VIEWPORTS) => ({
	parameters: { viewport: { options: PHONE_VIEWPORTS } },
	globals: { viewport: { value, isRotated: false } },
});
