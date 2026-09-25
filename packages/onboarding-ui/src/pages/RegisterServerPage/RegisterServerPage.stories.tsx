import type { StoryFn, Meta } from '@storybook/react-webpack5';

import RegisterServerPage from './RegisterServerPage';

export default {
	title: 'pages/RegisterServerPage',
	component: RegisterServerPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
	},
	args: {
		currentStep: 1,
		stepCount: 1,
		termsHref: '#',
		policyHref: '#',
	},
} satisfies Meta<typeof RegisterServerPage>;

export const _RegisterServerPage: StoryFn<typeof RegisterServerPage> = (args) => <RegisterServerPage {...args} />;
_RegisterServerPage.storyName = 'Online';

export const _RegisterServerPageOffline: StoryFn<typeof RegisterServerPage> = (args) => <RegisterServerPage {...args} offline />;

_RegisterServerPageOffline.storyName = 'Offline';
