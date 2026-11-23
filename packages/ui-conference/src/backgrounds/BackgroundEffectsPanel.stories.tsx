import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from 'storybook/test';

import BackgroundEffectsPanel from './BackgroundEffectsPanel';
import { fakeImages } from '../fixtures/backgroundFixtures';
import { withCall } from '../fixtures/callFixtures';
import { conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

/** The backgrounds panel beside a call. */
const meta = {
	component: BackgroundEffectsPanel,
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
} satisfies Meta<typeof BackgroundEffectsPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoEffect: Story = {
	decorators: [withCall()],
};

export const BlurLight: Story = {
	decorators: [withCall({ backgroundEffect: { effect: { kind: 'blur', level: 'light' } } })],
};

export const BlurMedium: Story = {
	decorators: [withCall({ backgroundEffect: { effect: { kind: 'blur', level: 'medium' } } })],
};

export const BlurStrong: Story = {
	decorators: [withCall({ backgroundEffect: { effect: { kind: 'blur', level: 'strong' } } })],
};

export const PresetSelected: Story = {
	decorators: [withCall({ backgroundEffect: { effect: { kind: 'preset', id: 'soft-gradient' } } })],
};

export const OwnImageSelected: Story = {
	decorators: [withCall({ backgroundEffect: { effect: { kind: 'image', id: 'beach' }, images: fakeImages } })],
};

export const OwnImagesOffered: Story = {
	decorators: [withCall({ backgroundEffect: { effect: { kind: 'blur', level: 'medium' }, images: fakeImages } })],
};

/** With as many pictures as may be kept, "Custom…" waits for one to be removed. */
export const OwnImagesLimitReached: Story = {
	decorators: [withCall({ backgroundEffect: { effect: { kind: 'none' }, images: fakeImages, imageLimit: fakeImages.length } })],
};

/** While an effect starts, nothing else can be chosen or removed. */
export const Starting: Story = {
	decorators: [
		withCall({ backgroundEffect: { effect: { kind: 'none' }, applying: { kind: 'blur', level: 'medium' }, images: fakeImages } }),
	],
};

export const LongFileName: Story = {
	decorators: [
		withCall({
			backgroundEffect: {
				effect: { kind: 'image', id: 'beach' },
				images: [{ ...fakeImages[0], name: 'family-reunion-at-the-lake-house-summer-2025-final-edit-v3-high-resolution.jpg' }],
			},
		}),
	],
};

export const ArabicFileName: Story = {
	decorators: [
		withCall({
			backgroundEffect: { effect: { kind: 'image', id: 'beach' }, images: [{ ...fakeImages[0], name: 'صورة الشاطئ في الصيف.jpg' }] },
		}),
	],
};

export const Keyboard: Story = {
	decorators: [withCall()],
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const light = await canvas.findByRole('row', { name: 'Light' });
		light.focus();
		await userEvent.keyboard('{ArrowRight}{ArrowRight}');
		await userEvent.keyboard('{Enter}');
	},
};
