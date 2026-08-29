/*
 * Several tiny wrappers live here on purpose — they are one story harness, and splitting a three-line provider
 * into its own file would scatter the setup a reader wants to read in one go.
 */
/* eslint-disable react/no-multi-comp */
import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useCurrentModal } from '@rocket.chat/ui-contexts';
import type { VideoConfContextValue } from '@rocket.chat/ui-video-conf';
import { VideoConfContext } from '@rocket.chat/ui-video-conf';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';
import { useContext, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import { action } from 'storybook/actions';

import type { ConferenceMember } from './hooks/useConferenceEmbedded';
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
export const conferenceAppRoot = () => mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true);

type Builder = ReturnType<typeof mockAppRoot>;

const ModalPortal = () => {
	const modal = useCurrentModal();

	return <>{modal}</>;
};

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
				<CallActions>
					<Story />
					{/* The mocked modal context holds what `setModal` was given but renders none of it, so a story
					    whose only action opens a modal would look like it does nothing. */}
					<ModalPortal />
				</CallActions>
			</I18nextProvider>
		</Providers>
	);
};

const CALL_PREFERENCES_KEY = 'videoconf-call-preferences';

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

/** Somewhere dark and call-shaped to put the chrome, which is only ever seen against a conference. */
export const CallSurface = ({ children, height = 'auto' }: { children: ReactNode; height?: string }) => (
	<div style={{ backgroundColor: '#1f2329', borderRadius: 4, display: 'flex', flexDirection: 'column', height, overflow: 'hidden' }}>
		{children}
	</div>
);

export const allCapabilities: VideoConferenceCapabilities = { mic: true, cam: true, title: true };

/** The four states a member of a call can be in, which is what the members list is for. */
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
