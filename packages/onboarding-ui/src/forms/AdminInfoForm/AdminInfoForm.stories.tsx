import type { StoryFn, Meta } from '@storybook/react-webpack5';

import AdminInfoForm from './AdminInfoForm';

export default {
	title: 'forms/AdminInfoForm',
	component: AdminInfoForm,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'centered',
	},
	argTypes: {
		validateUsername: { action: 'validateUsername' },
		validateEmail: { action: 'validateEmail' },
		validatePassword: { action: 'validatePassword' },
	},
	args: {
		currentStep: 1,
		stepCount: 1,
		passwordRulesHint: 'Password rules description goes here',
	},
} satisfies Meta<typeof AdminInfoForm>;

export const _AdminInfoForm: StoryFn<typeof AdminInfoForm> = (args) => <AdminInfoForm {...args} />;
_AdminInfoForm.storyName = 'AdminInfoForm';
