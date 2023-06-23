import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

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
} satisfies ComponentMeta<typeof Menu>;

export const Empty: ComponentStory<typeof Menu> = (args) => <Menu {...args} />;
Empty.storyName = 'empty';

export const Simple: ComponentStory<typeof Menu> = (args) => (
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

export const Placement: ComponentStory<typeof Menu> = (args) => (
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
