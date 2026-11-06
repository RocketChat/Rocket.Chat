import type { StoryFn, Meta } from '@storybook/react-webpack5';

import AwaitConfirmationForm from './AwaitConfirmationForm';

export default {
	title: 'forms/AwaitConfirmationForm',
	component: AwaitConfirmationForm,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'centered',
	},
	argTypes: {
		onResendEmailRequest: { action: 'resetEmailRequest' },
		onChangeEmailRequest: { action: 'changeEmailRequest' },
	},
	args: {
		currentStep: 4,
		stepCount: 4,
		securityCode: 'Funny Tortoise In The Hat',
		emailAddress: 'emailname@email.com',
	},
} satisfies Meta<typeof AwaitConfirmationForm>;

export const _AwaitConfirmationForm: StoryFn<typeof AwaitConfirmationForm> = (args) => <AwaitConfirmationForm {...args} />;
_AwaitConfirmationForm.storyName = 'AwaitConfirmationForm';
