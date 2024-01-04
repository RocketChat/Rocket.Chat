import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import Menu, { Group, Item } from '.';

export default {
	title: 'Components/Menu/Group',
	component: Group,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof Group>>;

export const Single: Story<ComponentProps<typeof Group>> = (args) => (
	<Menu>
		<Group {...args}>
			<Item>A menu item</Item>
			<Item>Another menu item</Item>
		</Group>
	</Menu>
);
Single.storyName = 'single';

export const Multiple: Story<ComponentProps<typeof Group>> = (args) => (
	<Menu>
		<Group {...args}>
			<Item>A menu item</Item>
			<Item>Another menu item</Item>
		</Group>
		<Group>
			<Item>Report</Item>
		</Group>
	</Menu>
);
Multiple.storyName = 'multiple';

export const WithTitle: Story<ComponentProps<typeof Group>> = (args) => (
	<Menu>
		<Group {...args}>
			<Item>A menu item</Item>
			<Item>Another menu item</Item>
		</Group>
	</Menu>
);
WithTitle.storyName = 'with title';
WithTitle.args = {
	title: 'Are you sure?',
};
