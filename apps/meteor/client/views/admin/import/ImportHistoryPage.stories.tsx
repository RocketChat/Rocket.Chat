import type { Meta, StoryFn } from '@storybook/react';

import ImportHistoryPage from './ImportHistoryPage';

export default {
	title: 'Admin/Import/ImportHistoryPage',
	component: ImportHistoryPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof ImportHistoryPage>;

export const Default: StoryFn<typeof ImportHistoryPage> = () => <ImportHistoryPage />;
Default.storyName = 'ImportHistoryPage';
