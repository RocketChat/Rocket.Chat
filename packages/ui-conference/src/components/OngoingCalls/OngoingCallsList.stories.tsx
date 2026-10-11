import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from 'storybook/test';

import OngoingCallsList from './OngoingCallsList';
import type { OngoingCallsFixture } from '../../fixtures/storyFixtures';
import { conferenceAppRoot, withCallProviders, withLiveOngoingCalls } from '../../fixtures/storyFixtures';
import { buildJoinableCall } from '../../fixtures/testFixtures';

/**
 * The list is handed its calls already grouped — which of them are still ringing is an answer with a clock in
 * it, and that is asked once, outside, rather than by each row. So each story is a different grouping rather
 * than a different set of props.
 *
 * What is *audibly* ringing here is a separate question, and not the list's: a ring sounding on another of this
 * user's sessions gets no Silence button, because there is nothing here to silence. So a story says which calls
 * this client can hear alongside the grouping, rather than arranging a second context to be read through.
 */
const withCalls = (value: OngoingCallsFixture) => [withLiveOngoingCalls(value), withCallProviders(conferenceAppRoot())];

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
			<Box width='x280' paddingBlock={8} borderRadius='large' backgroundColor='surface-light'>
				<Story />
			</Box>
		),
	],
} satisfies Meta<typeof OngoingCallsList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A call ringing this user right now: "Ringing…" where the time would be, and both Silence and Decline. */
export const Ringing: Story = {
	decorators: withCalls({ ringing: [ringing], audibleCalls: ['ringing'] }),
};

/**
 * The same ring, quietened: the Silence button gives way to a struck-through bell and Decline stays.
 *
 * Stated rather than clicked. Which rings have been quietened is not a fact about the call — it is this client
 * having been asked to stop making noise about one — so it arrives with the calls, and the list has nothing to
 * change about it.
 */
export const RingingSilenced: Story = {
	decorators: withCalls({ ringing: [ringing], silencedCalls: ['ringing'] }),
};

/**
 * A ring this client never heard — discovered by polling rather than announced to it. Nothing to silence, so
 * only Decline is offered.
 */
export const RingingNotHeardHere: Story = {
	decorators: withCalls({ ringing: [ringing] }),
};

/** A call simply running. No ring to answer, so the only action is to turn it down. */
export const Ongoing: Story = {
	decorators: withCalls({ ongoing: [ongoing] }),
};

/** Ringing first, then the ones merely running. */
export const Several: Story = {
	decorators: withCalls({
		ringing: [ringing],
		audibleCalls: ['ringing'],
		ongoing: [
			ongoing,
			buildJoinableCall({ callId: 'design', name: 'Design review', createdAt: new Date('2026-08-03T09:30:00.000Z'), usersCount: 2 }),
			buildJoinableCall({ callId: 'joined', name: 'Pairing session', joined: true, usersCount: 2 }),
		],
	}),
};

/**
 * A declined call is kept, below a divider — the way back into a call this user turned down. It carries
 * "(declined)" instead of a Decline button, because there is nothing left to decline.
 */
export const WithDeclinedCall: Story = {
	decorators: withCalls({
		ongoing: [ongoing],
		declined: [buildJoinableCall({ callId: 'refused', name: 'Design review', declined: true, usersCount: 3 })],
	}),
};

/**
 * More calls than the list shows at once. Collapsed to five with a "Show all" that counts what is hidden;
 * clicking it expands and turns into "Show fewer".
 */
export const Collapsed: Story = {
	decorators: withCalls({
		ongoing: Array.from({ length: 7 }, (_, index) =>
			buildJoinableCall({
				callId: `call-${index}`,
				name: `Call number ${index + 1}`,
				createdAt: new Date(Date.now() - index * 60_000),
				usersCount: index + 1,
			}),
		),
	}),
};

/** The same list expanded, which is still the list's own doing: how much of itself it shows is nobody else's. */
export const Expanded: Story = {
	decorators: Collapsed.decorators,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.click(await canvas.findByRole('button', { name: /Show all/ }));
	},
};

/** Nothing to join. The list renders empty — it is the navbar item that decides to disappear. */
export const Empty: Story = {
	decorators: withCalls({}),
};
