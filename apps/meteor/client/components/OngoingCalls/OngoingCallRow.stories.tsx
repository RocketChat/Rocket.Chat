import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import OngoingCallRow from './OngoingCallRow';
import { conferenceAppRoot, withCallProviders } from '../../views/conference/storyFixtures';
import { buildJoinableCall } from '../../views/conference/testFixtures';

/**
 * One row of a call that is merely running — the sidebar's room item with no avatar, a video mark instead, and
 * how many people are in it underneath.
 */
const meta = {
	component: OngoingCallRow,
	parameters: { layout: 'centered' },
	args: {
		call: buildJoinableCall({ callId: 'standup', name: 'Daily standup', usersCount: 4 }),
		onJoin: action('onJoin'),
	},
	decorators: [
		(Story) => (
			<Box width='x280' borderRadius='x8' backgroundColor='surface-light'>
				<Story />
			</Box>
		),
		withCallProviders(conferenceAppRoot()),
	],
} satisfies Meta<typeof OngoingCallRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A call this user has been asked about and not answered: joinable, and turn-downable. */
export const Joinable: Story = {
	args: { onDecline: action('onDecline') },
};

/**
 * A call turned down. It keeps its place in the list as the way back in, and says "(declined)" where the
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
		onDecline: action('onDecline'),
	},
};
