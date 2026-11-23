import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CameraWithoutEffectModal from './CameraWithoutEffectModal';
import { conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

const meta = {
	component: CameraWithoutEffectModal,
	parameters: { layout: 'fullscreen' },
	args: { onConfirm: action('confirm'), onCancel: action('cancel') },
	decorators: [withConferenceWindow(conferenceAppRoot())],
} satisfies Meta<typeof CameraWithoutEffectModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
