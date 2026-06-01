import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Menu, MenuGroup, MenuItem } from '.';

export default {
	title: 'Components/Menu/Group',
	component: MenuGroup,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof MenuGroup>>;

export const Single: StoryFn<ComponentProps<typeof MenuGroup>> = (args) => (
	<Menu>
		<MenuGroup {...args}>
			<MenuItem>A menu item</MenuItem>
			<MenuItem>Another menu item</MenuItem>
		</MenuGroup>
	</Menu>
);
Single.storyName = 'single';

export const Multiple: StoryFn<ComponentProps<typeof MenuGroup>> = (args) => (
	<Menu>
		<MenuGroup {...args}>
			<MenuItem>A menu item</MenuItem>
			<MenuItem>Another menu item</MenuItem>
		</MenuGroup>
		<MenuGroup>
			<MenuItem>Report</MenuItem>
		</MenuGroup>
	</Menu>
);
Multiple.storyName = 'multiple';

export const WithTitle: StoryFn<ComponentProps<typeof MenuGroup>> = (args) => (
	<Menu>
		<MenuGroup {...args}>
			<MenuItem>A menu item</MenuItem>
			<MenuItem>Another menu item</MenuItem>
		</MenuGroup>
	</Menu>
);
WithTitle.storyName = 'with title';
WithTitle.args = {
	title: 'Are you sure?',
};
