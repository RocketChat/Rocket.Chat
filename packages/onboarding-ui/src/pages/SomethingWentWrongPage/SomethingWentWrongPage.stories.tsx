import type { StoryFn, Meta } from '@storybook/react-webpack5';

import SomethingWentWrongPage from './SomethingWentWrongPage';

export default {
	title: 'pages/SomethingWentWrongPage',
	component: SomethingWentWrongPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
	},
	args: {
		requestId: undefined,
	},
} satisfies Meta<typeof SomethingWentWrongPage>;

export const _SomethingWentWrongPage: StoryFn<typeof SomethingWentWrongPage> = (args) => <SomethingWentWrongPage {...args} />;

_SomethingWentWrongPage.storyName = 'SomethingWentWrongPage';
