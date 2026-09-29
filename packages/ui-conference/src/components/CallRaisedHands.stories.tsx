import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from 'storybook/test';

import CallRaisedHands from './CallRaisedHands';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

const queue = [
	{ id: 'alan', name: 'Alan Turing' },
	{ id: 'ada', name: 'Ada Lovelace' },
	{ id: 'grace', name: 'Grace Hopper' },
];

/** Who is waiting to speak, next in line first, for the conference window's top bar. */
const meta = {
	component: CallRaisedHands,
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<CallSurface>
				<Story />
			</CallSurface>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallRaisedHands>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OneHand: Story = {
	args: { hands: queue.slice(0, 1) },
};

/** The front of the queue named, and how many are behind them. */
export const Queue: Story = {
	args: { hands: queue },
};

/** The whole line, in order. */
export const QueueOpen: Story = {
	args: { hands: queue },
	play: async ({ canvasElement }) => {
		await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Alan Turing raised their hand' }));
	},
};
