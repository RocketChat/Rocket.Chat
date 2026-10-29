import type { Meta, StoryObj } from '@storybook/react';

import RegisteredWorkspaceModal from './RegisteredWorkspaceModal';

export default {
	component: RegisteredWorkspaceModal,
	parameters: {
		layout: 'fullscreen',
	},
	argTypes: {
		onClose: { action: 'onClose' },
	},
} satisfies Meta<typeof RegisteredWorkspaceModal>;

export const Default: StoryObj<typeof RegisteredWorkspaceModal> = {};
