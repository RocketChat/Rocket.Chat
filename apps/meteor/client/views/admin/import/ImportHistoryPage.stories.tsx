import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import ImportHistoryPage from './ImportHistoryPage';

export default {
	title: 'Admin/Import/ImportHistoryPage',
	component: ImportHistoryPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof ImportHistoryPage>;

export const Default: ComponentStory<typeof ImportHistoryPage> = () => <ImportHistoryPage />;
Default.storyName = 'ImportHistoryPage';
