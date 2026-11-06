import type { StoryFn, Meta } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';

import CreateFirstMemberPage from './CreateFirstMemberPage';

export default {
	title: 'pages/CreateFirstMemberPage',
	component: CreateFirstMemberPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
	},
	args: {
		currentStep: 1,
		stepCount: 1,
		onSubmit: action('onSubmit'),
		onBackButtonClick: action('onBackButtonClick'),
		validateUsername: async (username) => (username === 'rocket' ? 'Invalid username' : true),
		validatePassword: async (password) => (password === '12345' ? 'Invalid password' : true),
	},
} satisfies Meta<typeof CreateFirstMemberPage>;

export const _CreateFirstMemberPage: StoryFn<typeof CreateFirstMemberPage> = (args) => <CreateFirstMemberPage {...args} />;
_CreateFirstMemberPage.storyName = 'CreateFirstMemberPage';
