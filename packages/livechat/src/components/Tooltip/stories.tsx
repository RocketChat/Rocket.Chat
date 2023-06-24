import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import Tooltip, { withTooltip } from '.';
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

export const Inline: Story<ComponentProps<typeof Tooltip>> = (args) => <Tooltip {...args} />;
Inline.storyName = 'inline';

export const Placements: Story<ComponentProps<typeof Tooltip>> = (args) => (
	<div style={{ display: 'flex', flexDirection: 'column' }}>
		{placements.map((placement, i) => (
			<Tooltip {...args} key={i} placement={placement} />
		))}
	</div>
);
Placements.storyName = 'placements';

export const ConnectedToAnotherComponent: Story<ComponentProps<typeof Tooltip.Trigger>> = (args) => (
	<Tooltip.Trigger {...args}>
		<Button>A simple button</Button>
	</Tooltip.Trigger>
);
ConnectedToAnotherComponent.storyName = 'connected to another component';
ConnectedToAnotherComponent.args = {
	content: 'A simple tool tip',
};
ConnectedToAnotherComponent.decorators = [(storyFn) => <Tooltip.Container>{storyFn()}</Tooltip.Container>];

const MyButton = withTooltip(Button);

export const WithTooltip: Story<{ tooltip?: string }> = ({ tooltip }) => <MyButton tooltip={tooltip}>A simple button</MyButton>;
WithTooltip.storyName = 'withTooltip()';
WithTooltip.args = {
	tooltip: 'A simple tool tip',
};
WithTooltip.decorators = [(storyFn) => <Tooltip.Container>{storyFn()}</Tooltip.Container>];
