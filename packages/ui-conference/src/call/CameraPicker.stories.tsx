import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { userEvent, within } from 'storybook/test';

import CameraPicker from './CameraPicker';
import { withCall } from '../fixtures/callFixtures';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

/** The camera menu of a call running in this window: which camera, how much detail, and what is done to the background. */
const meta = {
	component: CameraPicker,
	parameters: { layout: 'centered' },
	args: { onOpenBackgrounds: action('openBackgrounds') },
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

const openMenu = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Camera options' }));
};

export const CameraOn: Story = {
	decorators: [withCall({ state: { self: { cameraOn: true } } })],
};

/** Red like the camera toggle it is fused to. */
export const CameraOff: Story = {
	decorators: [withCall()],
};

/** The menu itself: cameras, background and quality. */
export const Open: Story = {
	decorators: [withCall({ state: { self: { cameraOn: true } } })],
	play: openMenu,
};

/** With a background effect on. */
export const OpenWithEffectOn: Story = {
	decorators: [withCall({ state: { self: { cameraOn: true } }, backgroundEffect: { effect: { kind: 'blur', level: 'strong' } } })],
	play: openMenu,
};

/** While an effect starts. */
export const OpenWhileStarting: Story = {
	decorators: [withCall({ state: { self: { cameraOn: true } }, backgroundEffect: { applying: { kind: 'blur', level: 'medium' } } })],
	play: openMenu,
};

/** A browser that cannot run background effects. */
export const OpenWithoutEffects: Story = {
	decorators: [withCall({ state: { self: { cameraOn: true } }, backgroundEffect: { supported: false } })],
	play: openMenu,
};

/** No camera to list: the menu has nothing to offer, so it cannot be opened. */
export const NoCamera: Story = {
	decorators: [withCall({ deviceSelection: { devices: [] } })],
};
