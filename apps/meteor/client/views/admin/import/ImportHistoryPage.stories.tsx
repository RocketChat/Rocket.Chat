import type { StoryObj, Meta } from '@storybook/react';

import ImportHistoryPage from './ImportHistoryPage';

export default {
	component: ImportHistoryPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof ImportHistoryPage>;

export const Default: StoryObj<typeof ImportHistoryPage> = {
	render: () => <ImportHistoryPage />,
	name: 'ImportHistoryPage',
};
