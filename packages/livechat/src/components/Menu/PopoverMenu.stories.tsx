import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { MenuGroup, MenuItem, MenuPopover } from '.';
import { Button } from '../Button';
import { PopoverContainer } from '../Popover';

export default {
	title: 'Components/Menu/PopoverMenu',
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

export const Default: StoryFn<ComponentProps<typeof MenuPopover>> = (args) => (
	<MenuPopover {...args} trigger={({ pop }) => <Button onClick={pop}>More options...</Button>}>
		<MenuGroup>
			<MenuItem>Reload</MenuItem>
			<MenuItem danger>Delete...</MenuItem>
		</MenuGroup>
	</MenuPopover>
);
Default.storyName = 'default';

export const WithOverlay: StoryFn<ComponentProps<typeof MenuPopover>> = (args) => (
	<MenuPopover {...args} trigger={({ pop }) => <Button onClick={pop}>More options...</Button>}>
		<MenuGroup>
			<MenuItem>Reload</MenuItem>
			<MenuItem danger>Delete...</MenuItem>
		</MenuGroup>
	</MenuPopover>
);
WithOverlay.storyName = 'with overlay';
WithOverlay.args = {
	overlayed: true,
};
