import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';

import CallParticipants from './CallParticipants';
import { conferenceAppRoot, withCallProviders } from '../views/conference/storyFixtures';

/**
 * Who is already in a call: their faces, then how many more there are.
 *
 * Faces answer *who* is in there, which is usually what decides whether to walk in — so the interesting states
 * are the ones where there are no faces to show.
 */
const meta = {
	component: CallParticipants,
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<Box backgroundColor='surface-light' padding={12} borderRadius='x4'>
				<Story />
			</Box>
		),
		withCallProviders(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallParticipants>;

export default meta;

type Story = StoryObj<typeof meta>;

const people = [
	{ _id: 'ada', username: 'ada' },
	{ _id: 'grace', username: 'grace' },
	{ _id: 'alan', username: 'alan' },
];

/** Everyone in the call has a face, so it ends with a plain "joined" rather than a count. */
export const AllShown: Story = {
	args: { people, total: 3 },
};

/** More in the call than faces shown: the rest become "+ N joined". */
export const WithOverflow: Story = {
	args: { people, total: 12 },
};

/**
 * One person. A blank circle keeps its place, so a single face doesn't read as a lone dot against the text.
 */
export const SinglePerson: Story = {
	args: { people: [people[0]], total: 1 },
};

/** The larger size, for a full screen rather than a sidebar row. */
export const LargerAvatars: Story = {
	args: { people, total: 7, size: 'x24' },
};

/**
 * Avatars turned off in preferences. There is nobody to show, so it falls back to the count in words — the way
 * the call's own message block says it.
 */
export const AvatarsDisabled: Story = {
	args: { people, total: 7 },
	decorators: [withCallProviders(conferenceAppRoot().withUserPreference('displayAvatars', false))],
};

/**
 * A call whose members didn't travel with it — an older server. Nobody has a username, so nobody can be drawn:
 * they are counted, not drawn as empty circles.
 */
export const NoUsernames: Story = {
	args: { people: [{ _id: 'ada' }, { _id: 'grace' }], total: 4 },
};
