import type { Meta, StoryObj } from '@storybook/react';

import RegisterWorkspaceModal from './RegisterWorkspaceModal';

export default {
	component: RegisterWorkspaceModal,
	parameters: {
		layout: 'fullscreen',
	},
	argTypes: {
		onClose: { action: 'onClose' },
	},
} satisfies Meta<typeof RegisterWorkspaceModal>;

export const Default: StoryObj<typeof RegisterWorkspaceModal> = {};
