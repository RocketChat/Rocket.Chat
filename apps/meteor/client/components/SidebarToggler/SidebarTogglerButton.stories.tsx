import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import SidebarTogglerButton from './SidebarTogglerButton';

export default {
	title: 'Components/SidebarToggler/SidebarTogglerButton',
	component: SidebarTogglerButton,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} as ComponentMeta<typeof SidebarTogglerButton>;

export const Example: ComponentStory<typeof SidebarTogglerButton> = () => <SidebarTogglerButton onClick={action('onClick')} />;

const Template: ComponentStory<typeof SidebarTogglerButton> = (args) => <SidebarTogglerButton {...args} />;

export const Default = Template.bind({});
export const WithBadge = Template.bind({});
WithBadge.args = {
	badge: 99,
};
