import type { Meta, StoryFn } from '@storybook/react';

import AnalyticsPage from './AnalyticsPage';

export default {
	title: 'Omnichannel/AnalyticsPage',
	component: AnalyticsPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof AnalyticsPage>;

export const Default: StoryFn<typeof AnalyticsPage> = () => <AnalyticsPage />;
Default.storyName = 'AnalyticsPage';
