import type { StoryFn, Meta } from '@storybook/react-webpack5';

import InvalidLinkPage from './InvalidLinkPage';

export default {
	title: 'pages/InvalidLinkPage',
	component: InvalidLinkPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
	},
} satisfies Meta<typeof InvalidLinkPage>;

export const _InvalidLinkPage: StoryFn<typeof InvalidLinkPage> = (args) => <InvalidLinkPage {...args} />;
_InvalidLinkPage.storyName = 'InvalidLinkPage';
