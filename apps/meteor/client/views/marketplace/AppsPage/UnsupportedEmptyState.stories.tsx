import type { Meta, StoryFn } from '@storybook/react';

import UnsupportedEmptyState from './UnsupportedEmptyState';

export default {
	title: 'Marketplace/Components/UnsupportedEmptyState',
	component: UnsupportedEmptyState,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as Meta<typeof UnsupportedEmptyState>;

export const Default: StoryFn<typeof UnsupportedEmptyState> = () => <UnsupportedEmptyState />;
Default.storyName = 'UnsupportedEmptyState';
