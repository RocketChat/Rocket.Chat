import type { StoryObj, Meta } from '@storybook/react';

import UnsupportedEmptyState from './UnsupportedEmptyState';

export default {
	component: UnsupportedEmptyState,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as Meta<typeof UnsupportedEmptyState>;

export const Default: StoryObj<typeof UnsupportedEmptyState> = {
	render: () => <UnsupportedEmptyState />,
	name: 'UnsupportedEmptyState',
};
