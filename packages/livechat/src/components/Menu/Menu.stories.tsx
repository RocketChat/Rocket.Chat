import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import Menu, { Group, Item } from '.';
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

export const Empty: Story<ComponentProps<typeof Menu>> = (args) => <Menu {...args} />;
Empty.storyName = 'empty';

export const Simple: Story<ComponentProps<typeof Menu>> = (args) => (
	<Menu {...args}>
		<Group>
			<Item onClick={action('clicked')}>A menu item</Item>
			<Item>Another menu item</Item>
		</Group>
	</Menu>
);
Simple.storyName = 'simple';
Simple.args = {
	children: (
		<Group>
			<Item onClick={action('clicked')}>A menu item</Item>
			<Item>Another menu item</Item>
		</Group>
	),
};

export const Placement: Story<ComponentProps<typeof Menu>> = (args) => (
	<div style={{ position: 'relative' }}>
		<Button>Button</Button>
		<Menu {...args}>
			<Group>
				<Item onClick={action('clicked')}>A menu item</Item>
				<Item>Another menu item</Item>
			</Group>
		</Menu>
	</div>
);
Placement.storyName = 'placement';
Placement.args = {
	placement: 'right-bottom',
};
