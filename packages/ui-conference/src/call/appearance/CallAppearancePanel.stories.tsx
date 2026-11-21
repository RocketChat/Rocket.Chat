import type { Meta, StoryObj } from '@storybook/react';

import CallAppearancePanel from './CallAppearancePanel';
import { backgroundImageSamples, withCall } from '../../fixtures/callFixtures';
import { conferenceAppRoot, withConferenceWindow } from '../../fixtures/storyFixtures';

/** How the reader looks in the call running in this window, and what is behind them. */
const meta = {
	component: CallAppearancePanel,
	parameters: { layout: 'fullscreen' },
	args: { onClose: () => undefined },
	decorators: [
		(Story) => (
			<div style={{ display: 'flex', flexDirection: 'column', width: '22.5rem', height: '100dvh' }}>
				<Story />
			</div>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallAppearancePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Nothing to preview until the camera is on, but the background can be chosen ahead of it. */
export const CameraOff: Story = {
	decorators: [withCall({ backgroundEffect: {} })],
};

export const BlurSelected: Story = {
	decorators: [withCall({ backgroundEffect: { current: { mode: 'blur' } } })],
};

/** Two uploaded images, the second in use: each can be taken away again. */
export const WithImages: Story = {
	decorators: [
		withCall({
			backgroundEffect: { images: backgroundImageSamples, current: { mode: 'image', imageUrl: backgroundImageSamples[1] } },
		}),
	],
};

/** On its way to the camera: nothing else can be chosen until it lands. */
export const Applying: Story = {
	decorators: [withCall({ backgroundEffect: { current: { mode: 'none' }, applying: { mode: 'blur' } } })],
};

export const NotSupported: Story = {
	decorators: [withCall({ backgroundEffect: { supported: false } })],
};
