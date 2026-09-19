import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';

import CallListItem from './CallListItem';
import { conferenceAppRoot, withCallProviders, withLiveRings, withOngoingCalls } from '../../fixtures/storyFixtures';
import { buildJoinableCall } from '../../fixtures/testFixtures';

/**
 * One call in the list: the sidebar's room item with no avatar, a video mark instead, and how many people are
 * in it underneath. What sits at its edges — "Ringing…" where the time goes, and the buttons at the end — is
 * read off the call, so these stories differ in the call rather than in what is passed alongside it.
 *
 * Two things are not the call's to say: whether a ring has been quietened here, and whether *this* client is
 * the one making the noise. Both come with the calls, asked one call at a time.
 */
const meta = {
	component: CallListItem,
	parameters: { layout: 'centered' },
	args: {
		call: buildJoinableCall({ callId: 'standup', name: 'Daily standup', usersCount: 4 }),
	},
	decorators: [
		(Story) => (
			<Box width='x280' borderRadius='large' backgroundColor='surface-light'>
				<Story />
			</Box>
		),
		// Whichever of these stories is of a ringing call, its ring is kept ringing — the row reads `ringingAt`
		// through `isRingingVideoConferenceMember`, which stops saying yes fifteen seconds after it was stamped.
		withLiveRings<ComponentProps<typeof CallListItem>>(({ call }, ringingAt) => ({
			call: call.ringingAt ? { ...call, ringingAt } : call,
		})),
		withOngoingCalls({ audibleCalls: ['ringing'] }),
		withCallProviders(conferenceAppRoot()),
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
	args: { call: ringing },
	decorators: [withOngoingCalls({ silencedCalls: ['ringing'] })],
};

/**
 * Declined a second into the ring. The ring window is still open and the payload carries no `declinedAt` to
 * compare it against, so the answer is what counts: no "Ringing…", nothing left to silence or decline.
 */
export const RingingButDeclined: Story = {
	args: { call: buildJoinableCall({ callId: 'refused', name: 'Design review', declined: true, ringingAt: new Date() }) },
};

/** The same rule from the other side: answering by joining ends the ring too. */
export const RingingButJoined: Story = {
	args: { call: buildJoinableCall({ callId: 'answered', name: 'Standup', joined: true, ringingAt: new Date() }) },
};

/**
 * A ring this client never heard, so there is no noise of its own to stop — only Decline. The row still says
 * it is ringing, because it is: somewhere else.
 */
export const RingingNotHeardHere: Story = {
	args: { call: ringing },
	decorators: [withOngoingCalls()],
};
