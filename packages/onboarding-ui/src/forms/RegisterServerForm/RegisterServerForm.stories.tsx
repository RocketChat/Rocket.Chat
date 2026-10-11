import type { Meta, StoryFn } from '@storybook/react-webpack5';

import RegisterServerForm from './RegisterServerForm';

export default {
	title: 'forms/RegisterServerForm',
	component: RegisterServerForm,
	parameters: {
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
	},
	args: {
		currentStep: 1,
		stepCount: 1,
	},
} satisfies Meta<typeof RegisterServerForm>;

export const _RegisterServerForm: StoryFn<typeof RegisterServerForm> = (args) => <RegisterServerForm {...args} />;
_RegisterServerForm.storyName = 'RegisterServerForm';

export const _RegisterServerFormOffline: StoryFn<typeof RegisterServerForm> = (args) => <RegisterServerForm {...args} offline />;

_RegisterServerFormOffline.storyName = 'RegisterServerFormOffline';
