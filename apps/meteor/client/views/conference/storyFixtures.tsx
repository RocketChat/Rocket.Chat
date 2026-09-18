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
import type { QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { action } from 'storybook/actions';

import ConferenceViewport from './ConferenceViewport';
import { callPreferencesStorageKey } from './hooks/useCallDevicesInitialState';
import type { ConferenceMember } from './hooks/useConferenceEmbedded';
import type { PluginFeature, PluginParticipant, ProviderPluginControls } from './hooks/useProviderPlugin';
import { PLUGIN_FEATURES } from './hooks/useProviderPlugin';
import { buildConferenceMember } from './testFixtures';
import { storybookI18n } from '../../stories/i18n';

/**
 * What the conference stories need from the app that a story can't get by rendering a component: the
 * providers, the real English copy, and a video-conf context whose actions log instead of throwing.
 *
 * The fixtures the *specs* build — calls, members, chat access — are not duplicated here; they come from
 * `testFixtures.ts`, which both sides import.
 */

/** A builder with the viewer every conference component expects. */
/**
 * The app a conference story renders in: signed in, avatars on, and the call window turned on — everything the
 * feature does is gated on that setting, so without it the stories of the joinable-calls list render nothing at
 * all.
 */
export const conferenceAppRoot = () =>
	mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true).withSetting('VideoConf_Conference_Window_Enabled', true);

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

const RingRenewal = ({ queryKey, children }: { queryKey: QueryKey; children: ReactNode }) => {
	const queryClient = useQueryClient();

	useEffect(() => {
		const interval = setInterval(() => void queryClient.invalidateQueries({ queryKey }), RING_RESTAMP_MS);

		return () => clearInterval(interval);
	}, [queryClient, queryKey]);

	return <>{children}</>;
};

/**
 * Asks for a fetched fixture again, for the stories whose ring is stamped by a mocked endpoint rather than
 * passed as an arg.
 *
 * Re-stamping per request is only half of it: what asks again decides how long the ring is stale for. Both lists
 * are re-read only when the stream says so, which in Storybook is never, against a fifteen-second window. So the
 * story asks on its own account, often enough that the ring it is documented to show never lapses.
 *
 * Must sit *inside* the providers: it needs their query client. In a story's `decorators` that means first.
 */
export const withRingRenewal =
	(queryKey: QueryKey): Decorator =>
	// eslint-disable-next-line react/display-name
	(Story) => (
		<RingRenewal queryKey={queryKey}>
			<Story />
		</RingRenewal>
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
