import type { Meta, StoryFn } from '@storybook/react-webpack5';

import LoginForm from './LoginForm';

export default {
	title: 'forms/LoginForm',
	component: LoginForm,
	parameters: {
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof LoginForm>;

export const _LoginForm: StoryFn<typeof LoginForm> = (args) => <LoginForm {...args} />;
_LoginForm.storyName = 'LoginForm';
