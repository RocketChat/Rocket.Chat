import type { Meta, StoryFn } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';

import CreateFirstMemberForm from './CreateFirstMemberForm';

export default {
	title: 'forms/CreateFirstMemberForm',
	component: CreateFirstMemberForm,
	parameters: {
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
	},
	args: {
		currentStep: 1,
		stepCount: 1,
		onSubmit: action('onSubmit'),
		onBackButtonClick: action('onBackButtonClick'),
		validateUsername: async (username) => (username === 'rocket' ? 'Invalid username' : true),
		validatePassword: async (password) => (password === '12345' ? 'Invalid password' : true),
	},
} satisfies Meta<typeof CreateFirstMemberForm>;

export const _CreateFirstMemberForm: StoryFn<typeof CreateFirstMemberForm> = (args) => <CreateFirstMemberForm {...args} />;

_CreateFirstMemberForm.storyName = 'CreateFirstMemberForm';
