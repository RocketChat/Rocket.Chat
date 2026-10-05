import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';

import OngoingCallsDropdown from './OngoingCallsDropdown';
import type { OngoingCallsFixture } from '../fixtures/storyFixtures';
import { conferenceAppRoot, withCallProviders, withLiveOngoingCalls } from '../fixtures/storyFixtures';
import { buildJoinableCall } from '../fixtures/testFixtures';

const withCalls = (value: OngoingCallsFixture) => [withLiveOngoingCalls(value), withCallProviders(conferenceAppRoot())];

/**
 * The navbar's way in to the calls running now. It is the button plus the dropdown it opens, so these stories
 * are about which of the two a reviewer sees — and the button's colour, which is the whole signal.
 */
const meta = {
	component: OngoingCallsDropdown,
	parameters: { layout: 'centered' },
	// Room beneath for the dropdown, which is absolutely positioned against the button.
	decorators: [
		(Story) => (
			<Box height='x400' display='flex' justifyContent='center' paddingBlockStart={16}>
				<Story />
			</Box>
		),
	],
} satisfies Meta<typeof OngoingCallsDropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Nothing to join, so the item renders nothing at all — no empty button in the navbar. The frame below is
 * deliberately blank.
 */
export const NoCalls: Story = {
	decorators: withCalls({}),
};

/** One call running: the button appears in info blue, badged with how many are reachable. */
export const OneOngoing: Story = {
	decorators: withCalls({ ongoing: [buildJoinableCall({ callId: 'standup', name: 'Daily standup', usersCount: 4 })] }),
};

/**
 * Something ringing. The button goes danger red, and the dropdown opens itself — a ring is not something to
 * make the user go looking for.
 */
export const Ringing: Story = {
	decorators: withCalls({
		ringing: [
			buildJoinableCall({
				callId: 'ringing',
				name: 'Ada Lovelace',
				ringingAt: new Date(),
				usersCount: 1,
				participants: [{ _id: 'ada', username: 'ada', name: 'Ada Lovelace' }],
			}),
		],
		audibleCalls: ['ringing'],
	}),
};

/** Several running at once. The badge counts them; the dropdown stays shut until asked. */
export const SeveralOngoing: Story = {
	decorators: withCalls({
		ongoing: [
			buildJoinableCall({ callId: 'standup', name: 'Daily standup', usersCount: 4 }),
			buildJoinableCall({ callId: 'design', name: 'Design review', createdAt: new Date('2026-08-03T09:30:00.000Z'), usersCount: 2 }),
			buildJoinableCall({ callId: 'pairing', name: 'Pairing session', joined: true, usersCount: 2 }),
		],
	}),
};

/**
 * Only a declined call left. It still counts towards showing the button — the way back in — but not towards
 * the badge, which is about calls actually on offer.
 */
export const OnlyDeclined: Story = {
	decorators: withCalls({ declined: [buildJoinableCall({ callId: 'refused', name: 'Design review', declined: true, usersCount: 3 })] }),
};
