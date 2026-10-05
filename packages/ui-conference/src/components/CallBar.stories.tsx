import type { Meta, StoryObj } from '@storybook/react';

import CallBar from './CallBar';
import CallControls from '../call/CallControls';
import { remoteParticipants, withCall } from '../fixtures/callFixtures';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

/** The in-call control bar along the bottom of the conference window, holding the call's own controls. */
const meta = {
	component: CallBar,
	parameters: { layout: 'fullscreen' },
	decorators: [
		(Story) => (
			<CallSurface>
				<Story />
			</CallSurface>
		),
		withCall({ state: { remoteParticipants } }),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { centre: <CallControls /> },
};
