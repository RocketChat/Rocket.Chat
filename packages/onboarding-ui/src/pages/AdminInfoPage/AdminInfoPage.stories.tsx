import type { StoryFn, Meta } from '@storybook/react-webpack5';

import AdminInfoPage from './AdminInfoPage';

export default {
	title: 'pages/AdminInfoPage',
	component: AdminInfoPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
	},
	argTypes: {
		validateUsername: { action: 'validateUsername' },
		validateEmail: { action: 'validateEmail' },
		validatePassword: { action: 'validatePassword' },
	},
	args: {
		currentStep: 1,
		stepCount: 1,
		passwordRulesHint: 'Password rules description goes here',
	},
} satisfies Meta<typeof AdminInfoPage>;

export const _AdminInfoPage: StoryFn<typeof AdminInfoPage> = (args) => <AdminInfoPage {...args} />;

export const _CloudAdminInfoPage: StoryFn<typeof AdminInfoPage> = (args) => <AdminInfoPage {...args} />;

_AdminInfoPage.storyName = 'AdminInfoPage';

_CloudAdminInfoPage.storyName = 'CloudAdminInfoPage';

_CloudAdminInfoPage.args = {
	title: 'Your Workspace is Ready!',
	description: 'Time to create your first admin user',
	keepPosted: true,
};
