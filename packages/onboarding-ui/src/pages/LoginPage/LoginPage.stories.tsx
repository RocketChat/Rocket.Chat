import type { StoryFn, Meta } from '@storybook/react-webpack5';

import LoginPage from './LoginPage';

export default {
	title: 'pages/LoginPage',
	component: LoginPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
	},
} satisfies Meta<typeof LoginPage>;

export const _LoginPage: StoryFn<typeof LoginPage> = (args) => <LoginPage {...args} />;
export const _LoginPasswordLessPage: StoryFn<typeof LoginPage> = (args) => <LoginPage {...args} />;
_LoginPage.storyName = 'CloudDefaultLoginPage';
_LoginPasswordLessPage.storyName = 'CloudPasswordLessLoginPage';

_LoginPasswordLessPage.args = { isPasswordLess: true };
