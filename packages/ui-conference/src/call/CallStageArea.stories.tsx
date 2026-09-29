import type { Meta, StoryObj } from '@storybook/react';

import CallStageArea from './CallStageArea';
import { remoteParticipants, withCall } from '../fixtures/callFixtures';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

/** The tiles of a call running in this window. */
const meta = {
	component: CallStageArea,
	parameters: { layout: 'fullscreen' },
	decorators: [
		(Story) => (
			<CallSurface height='100dvh'>
				<Story />
			</CallSurface>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallStageArea>;

export default meta;

type Story = StoryObj<typeof meta>;

const everyone = withCall({ state: { remoteParticipants } });

export const Grid: Story = {
	decorators: [everyone],
};

/** Nobody else has arrived yet. */
export const Alone: Story = {
	decorators: [withCall()],
};
