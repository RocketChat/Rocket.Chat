import type { StoryFn, Meta } from '@storybook/react-webpack5';

import InformationPage from './InformationPage';

export default {
	title: 'pages/InformationPage',
	component: InformationPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
	},
	args: {
		title: 'Place your title here',
		description: 'Place your description here',
	},
} satisfies Meta<typeof InformationPage>;

export const _InformationPage: StoryFn<typeof InformationPage> = (args) => <InformationPage {...args} />;
_InformationPage.storyName = 'InformationPage';
