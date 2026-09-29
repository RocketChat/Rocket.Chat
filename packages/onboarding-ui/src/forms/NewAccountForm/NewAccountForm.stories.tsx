import type { StoryFn, Meta } from '@storybook/react-webpack5';

import NewAccountForm from './NewAccountForm';

export default {
	title: 'forms/NewAccountForm',
	component: NewAccountForm,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'centered',
	},
	argTypes: {
		validateEmail: { action: 'validateEmail' },
		validatePassword: { action: 'validatePassword' },
		validateConfirmationPassword: { action: 'validateConfirmationPassword' },
	},
	args: {},
} satisfies Meta<typeof NewAccountForm>;

export const _NewAccountForm: StoryFn<typeof NewAccountForm> = (args) => <NewAccountForm {...args} />;
_NewAccountForm.storyName = 'NewAccountForm';
