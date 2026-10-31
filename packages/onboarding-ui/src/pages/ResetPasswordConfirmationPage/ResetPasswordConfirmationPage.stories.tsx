import type { Meta, StoryFn } from '@storybook/react-webpack5';

import ResetPasswordConfirmationPage from './ResetPasswordConfirmationPage';

export default {
	title: 'pages/ResetPasswordConfirmationPage',
	component: ResetPasswordConfirmationPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
	},
} satisfies Meta<typeof ResetPasswordConfirmationPage>;

export const _ResetPasswordConfirmationPage: StoryFn<typeof ResetPasswordConfirmationPage> = () => <ResetPasswordConfirmationPage />;
_ResetPasswordConfirmationPage.storyName = 'ResetPasswordConfirmationPage';
