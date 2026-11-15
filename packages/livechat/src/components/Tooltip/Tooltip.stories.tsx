import type { Meta, StoryObj } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import Tooltip from './Tooltip';
import TooltipContainer from './TooltipContainer';
import TooltipTrigger from './TooltipTrigger';
import { Button } from '../Button';

const placements = [null, 'left', 'top', 'right', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

export default {
	component: Tooltip,
	args: {
		children: 'A simple tool tip',
		hidden: false,
	},
	argTypes: {
		placement: {
			control: {
				type: 'select',
				options: placements,
			},
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof Tooltip>>;

export const Inline: StoryObj<ComponentProps<typeof Tooltip>> = {
	name: 'inline',
};

export const Placements: StoryObj<ComponentProps<typeof Tooltip>> = {
	name: 'placements',
	render: (args) => (
		<div style={{ display: 'flex', flexDirection: 'column' }}>
			{placements.map((placement, i) => (
				<Tooltip key={i} {...args} placement={placement} />
			))}
		</div>
	),
};

export const ConnectedToAnotherComponent: StoryObj<ComponentProps<typeof TooltipTrigger>> = {
	name: 'connected to another component',
	args: {
		content: 'A simple tool tip',
	},
	decorators: [(storyFn) => <TooltipContainer>{storyFn()}</TooltipContainer>],
	render: (args) => (
		<TooltipTrigger {...args}>
			<Button>A simple button</Button>
		</TooltipTrigger>
	),
};
