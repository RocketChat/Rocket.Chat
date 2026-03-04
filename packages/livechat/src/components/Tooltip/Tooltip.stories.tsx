import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import Tooltip from './Tooltip';
import TooltipContainer from './TooltipContainer';
import TooltipTrigger from './TooltipTrigger';
import { withTooltip } from './withTooltip';
import { Button } from '../Button';

const placements = [null, 'left', 'top', 'right', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

export default {
	title: 'Components/Tooltip',
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

export const Inline: StoryFn<ComponentProps<typeof Tooltip>> = (args) => <Tooltip {...args} />;
Inline.storyName = 'inline';

export const Placements: StoryFn<ComponentProps<typeof Tooltip>> = (args) => (
	<div style={{ display: 'flex', flexDirection: 'column' }}>
		{placements.map((placement, i) => (
			<Tooltip key={i} {...args} placement={placement} />
		))}
	</div>
);
Placements.storyName = 'placements';

export const ConnectedToAnotherComponent: StoryFn<ComponentProps<typeof TooltipTrigger>> = (args) => (
	<TooltipTrigger {...args}>
		<Button>A simple button</Button>
	</TooltipTrigger>
);
ConnectedToAnotherComponent.storyName = 'connected to another component';
ConnectedToAnotherComponent.args = {
	content: 'A simple tool tip',
};
ConnectedToAnotherComponent.decorators = [(storyFn) => <TooltipContainer>{storyFn()}</TooltipContainer>];

const MyButton = withTooltip(Button);

export const WithTooltip: StoryFn<{ tooltip?: string }> = ({ tooltip }) => <MyButton tooltip={tooltip}>A simple button</MyButton>;
WithTooltip.storyName = 'withTooltip()';
WithTooltip.args = {
	tooltip: 'A simple tool tip',
};
WithTooltip.decorators = [(storyFn) => <TooltipContainer>{storyFn()}</TooltipContainer>];
