import type { StoryFn, Meta } from '@storybook/react-webpack5';

import CreateNewAccountPage from './CreateNewAccountPage';

export default {
	title: 'pages/CreateNewAccountPage',
	component: CreateNewAccountPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
	},
	argTypes: {
		validateEmail: { action: 'validateEmail' },
		validatePassword: { action: 'validatePassword' },
		validateConfirmationPassword: { action: 'validateConfirmationPassword' },
	},
} satisfies Meta<typeof CreateNewAccountPage>;

export const _CreateNewAccountPage: StoryFn<typeof CreateNewAccountPage> = (args) => <CreateNewAccountPage {...args} />;
