import type { Decorator, Meta, StoryObj } from '@storybook/react';

import CallReactions from './CallReactions';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

/** A call to rise over: 20rem tall unless a story asks for more room. */
const withCallSurface: Decorator = (Story, { parameters }) => (
	<CallSurface height={parameters.surfaceHeight ?? '20rem'}>
		<div style={{ position: 'relative', flexGrow: 1 }}>
			<Story />
		</div>
	</CallSurface>
);

/** Reactions rising from the corner of the call, each with the name of whoever sent it. */
const meta = {
	component: CallReactions,
	parameters: { layout: 'fullscreen' },
	decorators: [withCallSurface, withConferenceWindow(conferenceAppRoot())],
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

/** Many at once: the oldest are pushed highest, and each still rises and fades out whole. */
export const Burst: Story = {
	// Room for the whole stack and its rise, so what is seen is the layer not clipping, rather than the story's frame.
	parameters: { surfaceHeight: '36rem' },
	args: {
		reactions: ['👍', '🎉', '😂', '❤️', '👏', '🔥', '😮', '🙌'].map((emoji, index) => ({
			id: String(index),
			emoji,
			name: ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson'][index % 4],
		})),
	},
};
