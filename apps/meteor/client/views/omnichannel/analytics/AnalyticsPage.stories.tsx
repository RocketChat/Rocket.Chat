import type { StoryObj, Meta } from '@storybook/react';

import AnalyticsPage from './AnalyticsPage';

export default {
	component: AnalyticsPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof AnalyticsPage>;

export const Default: StoryObj<typeof AnalyticsPage> = {
	render: () => <AnalyticsPage />,
	name: 'AnalyticsPage',
};
