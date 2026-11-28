import type { Meta, StoryObj } from '@storybook/react';

import NoInstalledAppsEmptyState from './NoInstalledAppsEmptyState';

export default {
	component: NoInstalledAppsEmptyState,
	parameters: {
		layout: 'fullscreen',
	},
	argTypes: {
		onButtonClick: { action: 'onButtonClick' },
	},
} satisfies Meta<typeof NoInstalledAppsEmptyState>;

export const Default: StoryObj<typeof NoInstalledAppsEmptyState> = {};
