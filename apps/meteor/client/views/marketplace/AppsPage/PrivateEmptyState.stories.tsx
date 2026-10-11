import type { StoryObj, Meta } from '@storybook/react';

import PrivateEmptyState from './PrivateEmptyState';

export default {
	component: PrivateEmptyState,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof PrivateEmptyState>;

export const Default: StoryObj<typeof PrivateEmptyState> = {
	render: () => <PrivateEmptyState />,
	name: 'PageEmptyPrivateApps',
};
