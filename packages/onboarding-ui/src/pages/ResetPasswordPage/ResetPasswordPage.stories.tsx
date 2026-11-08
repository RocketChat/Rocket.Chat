import type { StoryFn, Meta } from '@storybook/react-webpack5';

import ResetPasswordPage from './ResetPasswordPage';

export default {
	title: 'pages/ResetPasswordPage',
	component: ResetPasswordPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
	},
	argTypes: {
		validateEmail: { action: 'validateEmail' },
	},
} satisfies Meta<typeof ResetPasswordPage>;

export const _ResetPasswordPage: StoryFn<typeof ResetPasswordPage> = (args) => <ResetPasswordPage {...args} />;

_ResetPasswordPage.storyName = 'ResetPasswordPage';
