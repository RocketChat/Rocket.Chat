import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Group, Item, PopoverMenu } from '.';
import { Button } from '../Button';
import { PopoverContainer } from '../Popover';

export default {
	title: 'Components/Menu/PopoverMenu',
	component: PopoverMenu,
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
} satisfies Meta<ComponentProps<typeof PopoverMenu>>;

export const Default: Story<ComponentProps<typeof PopoverMenu>> = (args) => (
	<PopoverMenu {...args} trigger={({ pop }) => <Button onClick={pop}>More options...</Button>}>
		<Group>
			<Item>Reload</Item>
			<Item danger>Delete...</Item>
		</Group>
	</PopoverMenu>
);
Default.storyName = 'default';

export const WithOverlay: Story<ComponentProps<typeof PopoverMenu>> = (args) => (
	<PopoverMenu {...args} trigger={({ pop }) => <Button onClick={pop}>More options...</Button>}>
		<Group>
			<Item>Reload</Item>
			<Item danger>Delete...</Item>
		</Group>
	</PopoverMenu>
);
WithOverlay.storyName = 'with overlay';
WithOverlay.args = {
	overlayed: true,
};
