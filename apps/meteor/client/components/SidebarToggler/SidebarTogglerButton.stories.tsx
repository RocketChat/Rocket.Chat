import type { Meta, StoryFn } from '@storybook/react';
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

export const Example: StoryFn<typeof SidebarTogglerButton> = () => <SidebarTogglerButton onClick={action('onClick')} />;
export const Default = {};

export const WithBadge = {
	args: {
		badge: 99,
	},
};
