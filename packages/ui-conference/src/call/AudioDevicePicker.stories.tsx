import type { Meta, StoryObj } from '@storybook/react';

import AudioDevicePicker from './AudioDevicePicker';
import { withCall } from '../fixtures/callFixtures';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

const microphones = [
	{ id: 'default', label: 'Default - MacBook Pro Microphone', type: 'audioinput' },
	{ id: 'yeti', label: 'Yeti Stereo Microphone (046d:0ab7)', type: 'audioinput' },
];

const speakers = [{ id: 'default', label: 'Default - MacBook Pro Speakers', type: 'audiooutput' }];

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
		withConferenceWindow(conferenceAppRoot().withAudioInputDevices(microphones).withAudioOutputDevices(speakers)),
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
