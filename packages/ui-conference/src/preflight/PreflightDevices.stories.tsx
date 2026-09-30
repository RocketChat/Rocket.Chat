import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from 'storybook/test';

import PreflightDevices from './PreflightDevices';
import { withPreviewMedia } from '../fixtures/preflightFixtures';
import { conferenceAppRoot, embeddedCapabilities, storeCallPreferences, withConferenceWindow } from '../fixtures/storyFixtures';

/** The devices to arrive on, under the preflight's preview. */
const meta = {
	component: PreflightDevices,
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<div style={{ width: 640 }}>
				<Story />
			</div>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
	beforeEach: storeCallPreferences({}),
} satisfies Meta<typeof PreflightDevices>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Nothing chosen yet: each menu names the first device on offer, the system default where there is one. */
export const AllDevices: Story = {
	decorators: [withPreviewMedia()],
};

/** A provider that can't be told about a camera: there is no camera to choose. */
export const MicOnlyProvider: Story = {
	decorators: [withPreviewMedia({ capabilities: { ...embeddedCapabilities, cam: false } })],
};

/** Nothing listed: each menu says what it is for, and cannot be opened. */
export const NoDevices: Story = {
	decorators: [withPreviewMedia({ devices: [] })],
};

/** The camera menu itself. */
export const CameraMenuOpen: Story = {
	decorators: [withPreviewMedia()],
	play: async ({ canvasElement }) => {
		await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Camera' }));
	},
};
