import type { StoryFn, Meta } from '@storybook/react-webpack5';

import AwaitingConfirmationPage from './AwaitingConfirmationPage';

export default {
	title: 'pages/AwaitingConfirmationPage',
	component: AwaitingConfirmationPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
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
} satisfies Meta<typeof AwaitingConfirmationPage>;

export const _AwaitingConfirmationPage: StoryFn<typeof AwaitingConfirmationPage> = (args) => <AwaitingConfirmationPage {...args} />;
_AwaitingConfirmationPage.storyName = 'AwaitingConfirmationPage';
