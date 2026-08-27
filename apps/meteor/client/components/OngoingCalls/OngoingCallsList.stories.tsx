import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from 'storybook/test';

import OngoingCallsList from './OngoingCallsList';
import { conferenceAppRoot, withCallProviders } from '../../views/conference/storyFixtures';
import { buildJoinableCall } from '../../views/conference/testFixtures';

/**
 * The list drives itself from the joinable-calls endpoint, so each story is a different answer from the server
 * rather than a different set of props.
 */
const withCalls = (calls: JoinableVideoConference[], incoming: { callId: string; dismissed: boolean }[] = []) =>
	withCallProviders(
		conferenceAppRoot()
			.withEndpoint('GET', '/v1/video-conference.joinable', () => ({ calls, success: true }) as any)
			.withEndpoint('POST', '/v1/video-conference.decline', () => ({ success: true }) as any)
			// What is audibly ringing *here*. A ring the client never heard gets no Silence button, because there
			// is nothing to silence.
			.withIncomingCalls(incoming as any),
	);

const ringing = buildJoinableCall({
	callId: 'ringing',
	name: 'Ada Lovelace',
	ringingAt: new Date(),
	usersCount: 1,
	participants: [{ _id: 'ada', username: 'ada', name: 'Ada Lovelace' }],
});

const ongoing = buildJoinableCall({ callId: 'standup', name: 'Daily standup', usersCount: 4 });

const meta = {
	component: OngoingCallsList,
	parameters: { layout: 'centered' },
	// The list is only ever seen inside the navbar dropdown, which is what gives it its width and its surface.
	decorators: [
		(Story) => (
			<Box width='x280' paddingBlock={8} borderRadius='x8' backgroundColor='surface-light'>
				<Story />
			</Box>
		),
	],
} satisfies Meta<typeof OngoingCallsList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A call ringing this user right now: "Ringing…" where the time would be, and both Silence and Decline. */
export const Ringing: Story = {
	decorators: [withCalls([ringing], [{ callId: 'ringing', dismissed: false }])],
};

/**
 * The same ring after Silence is clicked: the button gives way to a struck-through bell and Decline stays.
 *
 * Reached by clicking rather than set up, because being silenced is this list's own state — the ring is
 * quietened for the session, not answered.
 */
export const RingingSilenced: Story = {
	decorators: [withCalls([ringing], [{ callId: 'ringing', dismissed: false }])],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.click(await canvas.findByRole('button', { name: 'Silence' }));
	},
};

/**
 * A ring this client never heard — discovered by polling rather than announced to it. Nothing to silence, so
 * only Decline is offered.
 */
export const RingingNotHeardHere: Story = {
	decorators: [withCalls([ringing])],
};

/** A call simply running. No ring to answer, so the only action is to turn it down. */
export const Ongoing: Story = {
	decorators: [withCalls([ongoing])],
};

/** Ringing first, then the ones merely running. */
export const Several: Story = {
	decorators: [
		withCalls(
			[
				ringing,
				ongoing,
				buildJoinableCall({ callId: 'design', name: 'Design review', createdAt: new Date('2026-08-03T09:30:00.000Z'), usersCount: 2 }),
				buildJoinableCall({ callId: 'joined', name: 'Pairing session', joined: true, usersCount: 2 }),
			],
			[{ callId: 'ringing', dismissed: false }],
		),
	],
};

/**
 * A declined call is kept, below a divider — the way back into a call this user turned down. It carries
 * "(declined)" instead of a Decline button, because there is nothing left to decline.
 */
export const WithDeclinedCall: Story = {
	decorators: [withCalls([ongoing, buildJoinableCall({ callId: 'refused', name: 'Design review', declined: true, usersCount: 3 })])],
};

/**
 * More calls than the list shows at once. Collapsed to five with a "Show all" that counts what is hidden;
 * clicking it expands and turns into "Show fewer".
 */
export const Collapsed: Story = {
	decorators: [
		withCalls(
			Array.from({ length: 7 }, (_, index) =>
				buildJoinableCall({
					callId: `call-${index}`,
					name: `Call number ${index + 1}`,
					createdAt: new Date(Date.now() - index * 60_000),
					usersCount: index + 1,
				}),
			),
		),
	],
};

/** Nothing to join. The list renders empty — it is the navbar item that decides to disappear. */
export const Empty: Story = {
	decorators: [withCalls([])],
};
