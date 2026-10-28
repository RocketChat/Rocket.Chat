import type { Meta, StoryObj } from '@storybook/react';

import RegisterWorkspaceSetupStepOneModal from './RegisterWorkspaceSetupStepOneModal';

export default {
	component: RegisterWorkspaceSetupStepOneModal,
	parameters: {
		layout: 'fullscreen',
	},
	args: {
		email: '',
		step: 1,
		terms: false,
		validInfo: false,
	},
	argTypes: {
		onClose: { action: 'onClose' },
		setEmail: { action: 'setEmail' },
		setStep: { action: 'setStep' },
		setTerms: { action: 'setTerms' },
		setIntentData: { action: 'setIntentData' },
	},
} satisfies Meta<typeof RegisterWorkspaceSetupStepOneModal>;

export const Default: StoryObj<typeof RegisterWorkspaceSetupStepOneModal> = {};
