import type { Meta, StoryObj } from '@storybook/react';

import NoAppRequestsEmptyState from './NoAppRequestsEmptyState';

export default {
	component: NoAppRequestsEmptyState,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof NoAppRequestsEmptyState>;

export const Default: StoryObj<typeof NoAppRequestsEmptyState> = {};
