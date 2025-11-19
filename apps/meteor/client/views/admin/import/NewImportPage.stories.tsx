import type { Meta, StoryFn } from '@storybook/react';

import NewImportPage from './NewImportPage';

export default {
	component: NewImportPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof NewImportPage>;

export const Default: StoryFn<typeof NewImportPage> = () => <NewImportPage />;
Default.storyName = 'NewImportPage';
