import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import AnalyticsPage from './AnalyticsPage';

export default {
	title: 'Omnichannel/AnalyticsPage',
	component: AnalyticsPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof AnalyticsPage>;

export const Default: ComponentStory<typeof AnalyticsPage> = () => <AnalyticsPage />;
Default.storyName = 'AnalyticsPage';
