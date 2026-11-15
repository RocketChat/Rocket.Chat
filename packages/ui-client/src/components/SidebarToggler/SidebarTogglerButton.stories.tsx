import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import SidebarTogglerButton from './SidebarTogglerButton';

export default {
	component: SidebarTogglerButton,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof SidebarTogglerButton>;

export const Example: StoryObj<typeof SidebarTogglerButton> = {
	render: () => <SidebarTogglerButton onClick={action('onClick')} />,
};

export const Default: StoryObj<typeof SidebarTogglerButton> = {};

export const WithBadge: StoryObj<typeof SidebarTogglerButton> = {
	args: {
		badge: 99,
	},
};
