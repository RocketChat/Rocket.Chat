import type { StoryFn, Meta } from '@storybook/react-webpack5';

import CreateCloudWorkspacePage from './CreateCloudWorkspacePage';

export default {
	title: 'pages/CreateCloudWorkspacePage',
	component: CreateCloudWorkspacePage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
	},
	args: {
		serverRegionOptions: [
			['us', 'US'],
			['br', 'BR'],
		],
		languageOptions: [
			['en', 'English'],
			['pt', 'Português'],
		],
		domain: 'rocket.chat',
		validateUrl: async (url) => (url === 'rocket' ? 'invalid url' : true),
		validateEmail: async (email) => (email === 'rocket@rocket.chat' ? 'invalid email' : true),
	},
} satisfies Meta<typeof CreateCloudWorkspacePage>;

export const _CreateCloudWorkspacePage: StoryFn<typeof CreateCloudWorkspacePage> = (args) => <CreateCloudWorkspacePage {...args} />;
_CreateCloudWorkspacePage.storyName = 'CreateCloudWorkspacePage';
