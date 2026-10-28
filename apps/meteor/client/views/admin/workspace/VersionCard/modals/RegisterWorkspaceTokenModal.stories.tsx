import type { Meta, StoryObj } from '@storybook/react';

import RegisterWorkspaceTokenModal from './RegisterWorkspaceTokenModal';

export default {
	component: RegisterWorkspaceTokenModal,
	parameters: {
		layout: 'fullscreen',
	},
	argTypes: {
		onClose: { action: 'onClose' },
	},
} satisfies Meta<typeof RegisterWorkspaceTokenModal>;

export const Default: StoryObj<typeof RegisterWorkspaceTokenModal> = {};
