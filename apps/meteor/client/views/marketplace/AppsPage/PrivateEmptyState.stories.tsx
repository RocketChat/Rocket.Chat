import type { Meta, StoryFn } from '@storybook/react';

import PrivateEmptyState from './PrivateEmptyState';

export default {
	title: 'Marketplace/Components/PageEmptyPrivateApps',
	component: PrivateEmptyState,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof PrivateEmptyState>;

export const Default: StoryFn<typeof PrivateEmptyState> = () => <PrivateEmptyState />;
Default.storyName = 'PageEmptyPrivateApps';
