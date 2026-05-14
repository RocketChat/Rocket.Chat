import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Menu, MenuGroup, MenuItem } from '.';
import { Button } from '../Button';

export default {
	title: 'Components/Menu',
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

export const Empty: StoryFn<ComponentProps<typeof Menu>> = (args) => <Menu {...args} />;
Empty.storyName = 'empty';

export const Simple: StoryFn<ComponentProps<typeof Menu>> = (args) => (
	<Menu {...args}>
		<MenuGroup>
			<MenuItem onClick={action('clicked')}>A menu item</MenuItem>
			<MenuItem>Another menu item</MenuItem>
		</MenuGroup>
	</Menu>
);
Simple.storyName = 'simple';
Simple.args = {
	children: (
		<MenuGroup>
			<MenuItem onClick={action('clicked')}>A menu item</MenuItem>
			<MenuItem>Another menu item</MenuItem>
		</MenuGroup>
	),
};

export const Placement: StoryFn<ComponentProps<typeof Menu>> = (args) => (
	<div style={{ position: 'relative' }}>
		<Button>Button</Button>
		<Menu {...args}>
			<MenuGroup>
				<MenuItem onClick={action('clicked')}>A menu item</MenuItem>
				<MenuItem>Another menu item</MenuItem>
			</MenuGroup>
		</Menu>
	</div>
);
Placement.storyName = 'placement';
Placement.args = {
	placement: 'right-bottom',
};
