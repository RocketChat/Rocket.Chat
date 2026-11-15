import type { Meta, StoryObj } from '@storybook/preact';
import type { ComponentProps } from 'preact';
import { action } from 'storybook/actions';

import { Menu, MenuGroup, MenuItem } from '.';
import { Button } from '../Button';

export default {
	component: Menu,
	args: {
		hidden: false,
	},
	argTypes: {
		placement: {
			control: {
				type: 'select',
				options: ['left-top', 'right-top', 'right-bottom', 'left-bottom'],
			},
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof Menu>>;

type Story = StoryObj<ComponentProps<typeof Menu>>;

export const Empty: Story = {
	name: 'empty',
};

export const Simple: Story = {
	name: 'simple',
	args: {
		children: (
			<MenuGroup>
				<MenuItem onClick={action('clicked')}>A menu item</MenuItem>
				<MenuItem>Another menu item</MenuItem>
			</MenuGroup>
		),
	},
	render: (args) => (
		<Menu {...args}>
			<MenuGroup>
				<MenuItem onClick={action('clicked')}>A menu item</MenuItem>
				<MenuItem>Another menu item</MenuItem>
			</MenuGroup>
		</Menu>
	),
};

export const Placement: Story = {
	name: 'placement',
	args: {
		placement: 'right-bottom',
	},
	render: (args) => (
		<div style={{ position: 'relative' }}>
			<Button>Button</Button>
			<Menu {...args}>
				<MenuGroup>
					<MenuItem onClick={action('clicked')}>A menu item</MenuItem>
					<MenuItem>Another menu item</MenuItem>
				</MenuGroup>
			</Menu>
		</div>
	),
};
