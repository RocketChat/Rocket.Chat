import type { Meta, StoryObj } from '@storybook/react';

import CallControls from './CallControls';
import { remoteParticipants, withCall } from '../fixtures/callFixtures';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

/** The controls of a call running in the conference window, in the states a caller sees them change through. */
const meta = {
	component: CallControls,
	parameters: { layout: 'centered' },
	args: { layout: 'grid', onLayoutChange: () => undefined, onOpenDiagnostics: () => undefined },
	decorators: [
		(Story) => (
			<CallSurface>
				<Story />
			</CallSurface>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A group call, microphone on and camera off: hanging up is leaving, since there is no one other side. */
export const Default: Story = {
	decorators: [withCall({ state: { remoteParticipants } })],
};

/** A call with one other person, which the hang-up button names. */
export const OneOnOne: Story = {
	decorators: [withCall({ state: { remoteParticipants: remoteParticipants.slice(0, 1) } })],
};

export const Muted: Story = {
	decorators: [withCall({ state: { self: { muted: true }, remoteParticipants } })],
};

/** Talking into a muted microphone raises the notice above the row. */
export const SpeakingWhileMuted: Story = {
	decorators: [withCall({ state: { self: { muted: true, speakingWhileMuted: true }, remoteParticipants } })],
};

export const CameraOnAndSharing: Story = {
	decorators: [withCall({ state: { self: { cameraOn: true, screenSharing: true }, remoteParticipants } })],
};
