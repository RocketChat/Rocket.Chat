import type { Meta, StoryObj } from '@storybook/react';

import RegisterWorkspaceSetupStepTwoModal from './RegisterWorkspaceSetupStepTwoModal';

export default {
	component: RegisterWorkspaceSetupStepTwoModal,
	parameters: {
		layout: 'fullscreen',
	},
	args: {
		email: 'admin@example.com',
		step: 2,
		intentData: {
			device_code: 'device-code',
			interval: 3600,
			user_code: 'ABCD-1234',
		},
	},
	argTypes: {
		onClose: { action: 'onClose' },
		setStep: { action: 'setStep' },
		onSuccess: { action: 'onSuccess' },
	},
} satisfies Meta<typeof RegisterWorkspaceSetupStepTwoModal>;

export const Default: StoryObj<typeof RegisterWorkspaceSetupStepTwoModal> = {};
