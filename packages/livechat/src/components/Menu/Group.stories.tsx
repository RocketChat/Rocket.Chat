import type { Meta, StoryObj } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Menu, MenuGroup, MenuItem } from '.';

export default {
	component: MenuGroup,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof MenuGroup>>;

type Story = StoryObj<ComponentProps<typeof MenuGroup>>;

export const Single: Story = {
	name: 'single',
	render: (args) => (
		<Menu>
			<MenuGroup {...args}>
				<MenuItem>A menu item</MenuItem>
				<MenuItem>Another menu item</MenuItem>
			</MenuGroup>
		</Menu>
	),
};

export const Multiple: Story = {
	name: 'multiple',
	render: (args) => (
		<Menu>
			<MenuGroup {...args}>
				<MenuItem>A menu item</MenuItem>
				<MenuItem>Another menu item</MenuItem>
			</MenuGroup>
			<MenuGroup>
				<MenuItem>Report</MenuItem>
			</MenuGroup>
		</Menu>
	),
};

export const WithTitle: Story = {
	name: 'with title',
	args: {
		title: 'Are you sure?',
	},
	render: (args) => (
		<Menu>
			<MenuGroup {...args}>
				<MenuItem>A menu item</MenuItem>
				<MenuItem>Another menu item</MenuItem>
			</MenuGroup>
		</Menu>
	),
};
