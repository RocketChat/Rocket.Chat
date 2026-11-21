import type { Meta, StoryObj } from '@storybook/react';

import BackgroundEffectsModal from './BackgroundEffectsModal';
import { fakeImages } from '../fixtures/backgroundFixtures';
import { withPreviewMedia } from '../fixtures/preflightFixtures';
import { conferenceAppRoot, storeCallPreferences, withConferenceWindow } from '../fixtures/storyFixtures';

/** The backgrounds dialog over the preflight. Stories have no camera, so the preview shows its placeholder. */
const meta = {
	component: BackgroundEffectsModal,
	parameters: { layout: 'fullscreen' },
	args: { onClose: () => undefined },
	decorators: [withConferenceWindow(conferenceAppRoot())],
	beforeEach: storeCallPreferences({ cam: true }),
} satisfies Meta<typeof BackgroundEffectsModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoEffect: Story = {
	decorators: [withPreviewMedia()],
};

export const WithOwnImage: Story = {
	decorators: [withPreviewMedia({ backgroundEffect: { effect: { kind: 'blur', level: 'light' }, images: fakeImages } })],
};
