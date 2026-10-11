import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from 'storybook/test';

import CameraPicker from './CameraPicker';
import { withCall } from '../fixtures/callFixtures';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

/** The camera menu of a call running in this window: which camera, how much detail, and what is done to the background. */
const meta = {
	component: CameraPicker,
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<CallSurface>
				<Story />
			</CallSurface>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof CameraPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CameraOn: Story = {
	decorators: [withCall({ state: { self: { cameraOn: true } } })],
};

/** Red like the camera toggle it is fused to. */
export const CameraOff: Story = {
	decorators: [withCall()],
};

/** The menu itself: the cameras, then the choices about their picture. */
export const Open: Story = {
	decorators: [withCall({ state: { self: { cameraOn: true } } })],
	play: async ({ canvasElement }) => {
		await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Camera options' }));
	},
};

/** No camera to list: the menu has nothing to offer, so it cannot be opened. */
export const NoCamera: Story = {
	decorators: [withCall({ deviceSelection: { devices: [] } })],
};
