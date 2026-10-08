import type { Meta, StoryObj } from '@storybook/react';

import AudioDevicePicker from './AudioDevicePicker';
import { withCall } from '../fixtures/callFixtures';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

/**
 * The microphone and speaker menu of a call running in this window. Its trigger shows what the microphone hears
 * while it is on, and the chevron while it is muted.
 */
const meta = {
	component: AudioDevicePicker,
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<CallSurface>
				<Story />
			</CallSurface>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof AudioDevicePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MicrophoneOn: Story = {
	decorators: [withCall()],
};

/** Red like the mute toggle it is fused to, with nothing to show about a microphone that is off. */
export const Muted: Story = {
	decorators: [withCall({ state: { self: { muted: true } } })],
};
