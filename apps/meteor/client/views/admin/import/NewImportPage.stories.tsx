import type { StoryObj, Meta } from '@storybook/react';

import NewImportPage from './NewImportPage';

export default {
	component: NewImportPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof NewImportPage>;

export const Default: StoryObj<typeof NewImportPage> = {
	render: () => <NewImportPage />,
	name: 'NewImportPage',
};
