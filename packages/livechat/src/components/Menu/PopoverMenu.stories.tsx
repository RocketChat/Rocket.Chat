import type { ComponentMeta, ComponentStory } from '@storybook/react';

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
} satisfies ComponentMeta<typeof PopoverMenu>;

export const Default: ComponentStory<typeof PopoverMenu> = (args) => (
	<PopoverMenu {...args} trigger={({ pop }) => <Button onClick={pop}>More options...</Button>}>
		<Group>
			<Item>Reload</Item>
			<Item danger>Delete...</Item>
		</Group>
	</PopoverMenu>
);
Default.storyName = 'default';

export const WithOverlay: ComponentStory<typeof PopoverMenu> = (args) => (
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
