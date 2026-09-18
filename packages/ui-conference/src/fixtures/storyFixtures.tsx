/*
 * Several tiny wrappers live here on purpose — they are one story harness, and splitting a three-line provider
 * into its own file would scatter the setup a reader wants to read in one go.
 */
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
import ConferenceViewport from '../views/ConferenceViewport';

/**
 * What the conference stories need that a story can't get by rendering a component: the shared providers, the
 * real English copy, and a conference whose actions log instead of reaching a server that isn't there.
 *
 * The fixtures the *specs* build — calls, members, chat access — are not duplicated here; they come from
 * `testFixtures.ts`, which both sides import.
 */

/** Who `withJohnDoe` logs in as, so the context says the same thing the app root does. */
export const JOHN_DOE_ID = 'john.doe';

/** A builder with the viewer every conference component expects. */
export const conferenceAppRoot = () => mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true);

type Builder = ReturnType<typeof mockAppRoot>;

/**
 * Replaces the video-conf actions with logged ones.
 *
 * `mockAppRoot`'s video-conf actions throw on purpose, so a *test* triggering one has to say what it expects.
 * A story has no expectation to state — a reviewer clicking Join wants to see it register, not an error
 * overlay — so here they land in the Actions panel instead.
 */
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

/**
 * The providers, then the logged actions, then whatever the component opens as a modal.
 *
 * Composed by hand rather than as a list of decorators because the video-conf override has to sit *inside* the
 * builder's own provider to be able to read it — and decorator order is not the place to express that.
 */
export const withCallProviders = (builder: Builder): Decorator => {
	const Providers = builder.build();

	// eslint-disable-next-line react/display-name
	return (Story) => (
		<Providers>
			{/* `Providers` installs an i18next instance with no resources, and the nearest provider is the one a
			    component reads — so the real copy has to go back in front of it, inside. Without this every string
			    here renders as its key name. */}
			<I18nextProvider i18n={storybookI18n}>
				{/* Whatever a story opens as a modal is rendered by the builder's own providers, so there is no
				    portal of ours here — a second one showed every modal twice. */}
				<CallActions>
					<Story />
				</CallActions>
			</I18nextProvider>
		</Providers>
	);
};

/**
 * A conference as a story states it: each group filled in only where it differs from "not yet".
 *
 * Deeper than `Partial<ConferenceContextValue>`, which would make a story naming one member supply the other
 * seven facts about the call alongside it.
 */
export type ConferenceFixture = Omit<Partial<ConferenceContextValue>, 'call' | 'room' | 'session' | 'actions' | 'slots' | 'viewer'> & {
	call?: Partial<ConferenceContextValue['call']>;
	room?: Partial<ConferenceContextValue['room']>;
	session?: Partial<ConferenceContextValue['session']>;
	actions?: Partial<ConferenceContextValue['actions']>;
	slots?: Partial<ConferenceContextValue['slots']>;
	viewer?: Partial<ConferenceContextValue['viewer']>;
};

/**
 * A conference, told rather than fetched.
 *
 * Every action logs, which is the whole point of the package taking them as a value: a story can show the
 * members panel of a ringing call without a server, a query client or a route existing anywhere.
 */
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
		// Presence is a live store, and a story has nothing to say about it — but the column it sits in is part of
		// the row's shape, so it is drawn rather than left out.
		renderMemberStatus: () => <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: '#2de0a5' }} />,
		...slots,
	},
	// A workspace that shows faces and lets this caller ring people — the arrangement most stories are about.
	// The ones that are about the opposite say so, which is the point of it being a value rather than a setting.
	viewer: { uid: JOHN_DOE_ID, useRealName: false, displayAvatars: true, canRingUsers: true, ...viewer },
});

/** Puts that conference in front of a story. */
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
					// Only the ones already stamped: a member who was never rung must come back unrung, or every row
					// in the panel would claim a ring.
					members: (value.call?.members ?? []).map((member) => (member.ringingAt ? { ...member, ringingAt } : member)),
				},
			}),
		[value, ringingAt],
	);

	return <ConferenceContext.Provider value={conference}>{children}</ConferenceContext.Provider>;
};

/**
 * A conference whose rings stay rings.
 *
 * A member's row asks `isRingingVideoConferenceMember`, which stops saying yes fifteen seconds after the stamp —
 * so a fixture built when the module loaded shows a ringing row to whoever opens Storybook first and a waiting
 * one to everybody after.
 */
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

/**
 * The same, for the list of calls in the navbar — a different mount point, so a context of its own.
 *
 * Which rings are audible and which were hushed arrive as plain lists of call ids, because that is how a story
 * states a situation. The context is asked one call at a time, which is how a row reads it.
 */
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
	formatTime: (date) => date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }),
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
				// Only the ringing bucket: a call in the others has either been answered or never rang, and stamping
				// it would make the row claim a ring that is not this story's subject.
				ringing: (value.ringing ?? []).map((call) => ({ ...call, ringingAt })),
			}),
		[value, ringingAt],
	);

	return <OngoingCallsContext.Provider value={calls}>{children}</OngoingCallsContext.Provider>;
};

/**
 * The same, with every ring in the list kept ringing.
 *
 * A row decides for itself whether a call is ringing, from `ringingAt` and the fifteen-second window — so a
 * bucket stamped when the module loaded quietly turns a story documented as ringing into an ordinary one while
 * somebody is looking at it. This moves the moment forward instead, for as long as anyone is.
 */
export const withLiveOngoingCalls =
	(value: OngoingCallsFixture): Decorator =>
	// eslint-disable-next-line react/display-name
	(Story) => (
		<LiveOngoingCalls value={value}>
			<Story />
		</LiveOngoingCalls>
	);

/**
 * The same providers, inside the window itself — for the stories that *are* the window: the preflight and the
 * call page.
 *
 * `ConferenceViewport` is where the window's palette lives, so without it a story of the call renders in
 * Storybook's own theme: light controls over the black call area, which is precisely what the window exists to
 * avoid. It is also what gives the story the viewport box and the modal region the page opens into.
 */
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

// The record is kept per account, and every story here is John Doe — see `conferenceAppRoot`.
const CALL_PREFERENCES_KEY = callPreferencesStorageKey('john.doe');

/**
 * Seeds the remembered call preferences.
 *
 * Whether the preflight arrives with the camera on is not a prop — it is a habit, kept in local storage — so a
 * story that wants to show it on has to say so where the component actually reads it.
 */
export const storeCallPreferences = (preferences: { mic?: boolean; cam?: boolean; ring?: boolean }) => () => {
	const previous = localStorage.getItem(CALL_PREFERENCES_KEY);

	localStorage.setItem(CALL_PREFERENCES_KEY, JSON.stringify({ mic: true, cam: false, ring: true, ...preferences }));

	// Put back whatever was there, so one story's camera doesn't decide the next one's.
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
 * `isRingingVideoConferenceMember` answers no once `ringingAt` is `VIDEO_CONF_RINGING_WINDOW_MS` old, and a
 * fixture stamped when its module loaded is that old fifteen seconds into the session — so a story documented as
 * ringing shows a ringing row to whoever opens Storybook first and an ordinary one to everybody after. This
 * moves the moment forward on a timer instead, for as long as anyone is looking.
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
 * Re-stamps a story's rings with {@link useLiveRingingAt}.
 *
 * Which args are rings is the story's to say — a call here, a member there, a list of members elsewhere — so
 * that is the argument, and this only carries the clock. Whatever has no `ringingAt` must come back without one:
 * these sit on a whole file's `meta`, where most stories are of something that is not ringing at all.
 */
export const withLiveRings =
	// Unparameterized `Decorator`: a `Decorator<TArgs>` in a `meta.decorators` array alongside plain ones widens
	// the array to a union that `composeStories` cannot read the stories out of. The args are named by the
	// caller's `restamp` instead, which is where the checking is worth having.
	<TArgs,>(restamp: (args: TArgs, ringingAt: Date) => Partial<TArgs>): Decorator =>
		// eslint-disable-next-line react/display-name
		(Story, { args }) => (
			// Spread, because `args` on a story replaces rather than merges: handing over only what was re-stamped
			// dropped every other arg, callbacks included.
			<LiveRing>{(ringingAt) => <Story args={{ ...args, ...restamp(args as unknown as TArgs, ringingAt) }} />}</LiveRing>
		);

/** Somewhere dark and call-shaped to put the chrome, which is only ever seen against a conference. */
export const CallSurface = ({ children, height = 'auto' }: { children: ReactNode; height?: string }) => (
	<div style={{ backgroundColor: '#1f2329', borderRadius: 4, display: 'flex', flexDirection: 'column', height, overflow: 'hidden' }}>
		{children}
	</div>
);

export const allCapabilities: VideoConferenceCapabilities = { mic: true, cam: true, title: true };

/**
 * The four states a member of a call can be in, which is what the members list is for.
 *
 * `ringing` is stamped here and re-stamped by {@link withLiveRings}, which every story showing it installs — on
 * its own this timestamp is a ring for fifteen seconds and an unanswered invitation thereafter.
 */
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
 * The two shapes a phone gives a call: a tall, narrow window and a short, wide one.
 *
 * Declared here rather than taken from Storybook's built-in set so the numbers are the ones the layout actually
 * turns on — 393x852 is an iPhone's own viewport, and the landscape entry is the case the conference window and
 * the preflight both got wrong: wide enough to pass for a desktop (852px is past the `md` breakpoint) while far
 * too short to stack anything.
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
