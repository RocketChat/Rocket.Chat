import type { Meta, StoryObj } from '@storybook/react';

import CallReactions from './CallReactions';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

/** Reactions rising from the corner of the call, each with the name of whoever sent it. */
const meta = {
	component: CallReactions,
	parameters: { layout: 'fullscreen' },
	decorators: [
		(Story) => (
			<CallSurface height='20rem'>
				<div style={{ position: 'relative', flexGrow: 1 }}>
					<Story />
				</div>
			</CallSurface>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallReactions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Several: Story = {
	args: {
		reactions: [
			{ id: '1', emoji: '👍', name: 'Ada Lovelace' },
			{ id: '2', emoji: '🎉', name: 'Grace Hopper' },
			{ id: '3', emoji: '😂', name: 'Alan Turing' },
		],
	},
};

/** From someone the call cannot name: the emoji still rises, unattributed. */
export const Unattributed: Story = {
	args: { reactions: [{ id: '1', emoji: '❤️' }] },
};
