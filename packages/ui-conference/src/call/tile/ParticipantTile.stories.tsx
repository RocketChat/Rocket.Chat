import type { Meta, StoryObj } from '@storybook/react';

import ParticipantTile from './ParticipantTile';
import SelfTile from './SelfTile';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../../fixtures/storyFixtures';

/**
 * One person's tile: their camera or, without one, their avatar; their name; and the corner that says what their
 * microphone is doing. The reader's own tile is mirrored; see `Self`.
 */
const meta = {
	component: ParticipantTile,
	parameters: { layout: 'centered' },
	args: { displayName: 'Ada Lovelace', muted: false, held: false },
	decorators: [
		(Story) => (
			<CallSurface>
				<div style={{ width: '20rem', aspectRatio: '16 / 9' }}>
					<Story />
				</div>
			</CallSurface>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof ParticipantTile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Muted: Story = {
	args: { muted: true },
};

/** On hold: the corner says so beside the microphone. */
export const Held: Story = {
	args: { held: true },
};

/** The reader's own tile. */
export const Self: Story = {
	render: () => <SelfTile displayName='John Doe' muted={false} held={false} />,
};
