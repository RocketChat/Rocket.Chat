import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CallListItem from './CallListItem';
import { conferenceAppRoot, withCallProviders } from '../../views/conference/storyFixtures';
import { buildJoinableCall } from '../../views/conference/testFixtures';

/**
 * One call in the list: the sidebar's room item with no avatar, a video mark instead, and how many people are
 * in it underneath. What sits at its edges — "Ringing…" where the time goes, and the buttons at the end — is
 * read off the call, so these stories differ in the call rather than in what is passed alongside it.
 *
 * The exception is whether a ring can be silenced, which is not the call's to say: the row asks whether *this*
 * client is the one making the noise, so those stories differ in what the video-conf context reports.
 */
const meta = {
	component: CallListItem,
	parameters: { layout: 'centered' },
	args: {
		call: buildJoinableCall({ callId: 'standup', name: 'Daily standup', usersCount: 4 }),
		onJoin: action('onJoin'),
		onDecline: action('onDecline'),
		onSilence: action('onSilence'),
	},
	decorators: [
		(Story) => (
			<Box width='x280' borderRadius='x8' backgroundColor='surface-light'>
				<Story />
			</Box>
		),
		withCallProviders(conferenceAppRoot().withIncomingCalls([{ callId: 'ringing', dismissed: false }] as any)),
	],
} satisfies Meta<typeof CallListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A call this user has been asked about and not answered: joinable, and turn-downable. */
export const Joinable: Story = {};

/**
 * A call turned down. It keeps its place in the list as the way back in, and says "(Declined)" where the
 * Decline button was — there is nothing left to decline.
 */
export const Declined: Story = {
	args: { call: buildJoinableCall({ callId: 'refused', name: 'Design review', declined: true, usersCount: 3 }) },
};

/**
 * A call this user is already in. No decline offered — leaving a call is not something a list row does.
 */
export const Joined: Story = {
	args: { call: buildJoinableCall({ callId: 'joined', name: 'Pairing session', joined: true, usersCount: 2 }) },
};

/** One person in it, which is the singular the count has to get right. */
export const SinglePerson: Story = {
	args: {
		call: buildJoinableCall({
			callId: 'alone',
			name: 'Ada Lovelace',
			usersCount: 1,
			participants: [{ _id: 'ada', username: 'ada', name: 'Ada Lovelace' }],
		}),
	},
};

const ringing = buildJoinableCall({
	callId: 'ringing',
	name: 'Ada Lovelace',
	ringingAt: new Date(),
	usersCount: 1,
	participants: [{ _id: 'ada', username: 'ada', name: 'Ada Lovelace' }],
});

/** Sounding here: Silence and Decline, and "Ringing…" in place of the time. */
export const Ringing: Story = {
	args: { call: ringing },
};

/** Quietened. The Silence button becomes a struck-through bell; Decline is still the way to turn it down. */
export const RingingSilenced: Story = {
	args: { call: ringing, silenced: true },
};

/**
 * A ring this client never heard, so there is no noise of its own to stop — only Decline. The row still says
 * it is ringing, because it is: somewhere else.
 */
export const RingingNotHeardHere: Story = {
	args: { call: ringing },
	decorators: [withCallProviders(conferenceAppRoot())],
};
