import type { Meta, StoryFn } from '@storybook/react';

import SidebarTogglerButton from './SidebarTogglerButton';

export default {
	title: 'Components/Sidebar/SidebarTogglerButton',
	component: SidebarTogglerButton,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof SidebarTogglerButton>;

const Template: StoryFn<typeof SidebarTogglerButton> = (args) => <SidebarTogglerButton {...args} />;

export const Example = Template.bind({});
export const WithBadge = Template.bind({});
WithBadge.args = {
	badge: 99,
};
