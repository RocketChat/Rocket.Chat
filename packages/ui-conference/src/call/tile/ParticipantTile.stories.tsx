import type { Meta, StoryObj } from '@storybook/react';

import ParticipantThumbnail from './ParticipantThumbnail';
import ParticipantTile from './ParticipantTile';
import SelfThumbnail from './SelfThumbnail';
import SelfTile from './SelfTile';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../../fixtures/storyFixtures';

/**
 * One person's tile: their camera or, without one, their avatar; their name; and the corner that says what their
 * microphone is doing. The same frame at two sizes — a grid cell or the stage, and a thumbnail — and for the
 * reader, mirrored and saying what it sends.
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

/** Third in the queue: the name gets a plate, and the plate the position. */
export const HandRaised: Story = {
	args: { handPosition: 3 },
};

/** The reader's own tile, which alone says what its encoder is sending. */
export const Self: Story = {
	render: () => <SelfTile displayName='John Doe' muted={false} held={false} sendHeight={720} />,
};

export const Thumbnail: Story = {
	render: () => <ParticipantThumbnail displayName='Ada Lovelace' muted={false} held={false} />,
};

export const SelfThumbnailMuted: Story = {
	name: 'Self thumbnail, muted',
	render: () => <SelfThumbnail displayName='John Doe' muted held={false} />,
};
