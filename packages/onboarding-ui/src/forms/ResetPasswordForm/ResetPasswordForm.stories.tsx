import type { Meta, StoryFn } from '@storybook/react-webpack5';

import ResetPasswordForm from './ResetPasswordForm';

export default {
	title: 'forms/ResetPasswordForm',
	component: ResetPasswordForm,
	parameters: {
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof ResetPasswordForm>;

export const _ResetPasswordForm: StoryFn<typeof ResetPasswordForm> = (args) => <ResetPasswordForm {...args} />;
_ResetPasswordForm.storyName = 'ResetPasswordForm';
