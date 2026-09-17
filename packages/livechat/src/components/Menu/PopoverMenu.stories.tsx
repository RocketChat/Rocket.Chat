import type { Meta, StoryObj } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { MenuGroup, MenuItem, MenuPopover } from '.';
import { Button } from '../Button';
import { PopoverContainer } from '../Popover';

export default {
	component: MenuPopover,
	args: {},
	decorators: [
		(storyFn) => (
			<PopoverContainer>
				<div style={{ display: 'flex', width: '100vw', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>{storyFn()}</div>
			</PopoverContainer>
		),
	],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<ComponentProps<typeof MenuPopover>>;

type Story = StoryObj<ComponentProps<typeof MenuPopover>>;

export const Default: Story = {
	name: 'default',
	render: (args) => (
		<MenuPopover {...args} trigger={({ pop }) => <Button onClick={pop}>More options...</Button>}>
			<MenuGroup>
				<MenuItem>Reload</MenuItem>
				<MenuItem danger>Delete...</MenuItem>
			</MenuGroup>
		</MenuPopover>
	),
};

export const WithOverlay: Story = {
	name: 'with overlay',
	args: {
		overlayed: true,
	},
	render: (args) => (
		<MenuPopover {...args} trigger={({ pop }) => <Button onClick={pop}>More options...</Button>}>
			<MenuGroup>
				<MenuItem>Reload</MenuItem>
				<MenuItem danger>Delete...</MenuItem>
			</MenuGroup>
		</MenuPopover>
	),
};
