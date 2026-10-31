import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Box } from '../Box';
import { Tile } from '../Tile';
import AnimatedVisibility from './AnimatedVisibility';

export default {
	title: 'Layout/AnimatedVisibility',
	component: AnimatedVisibility,
	argTypes: {
		visibility: {
			control: 'inline-radio',
			options: [AnimatedVisibility.VISIBLE, AnimatedVisibility.HIDDEN, AnimatedVisibility.HIDING, AnimatedVisibility.UNHIDING],
			description: 'Current visibility state; transitions between these values play the show/hide animation.',
			table: { category: 'State' },
		},
		children: {
			control: false,
			description: 'Box-based element to render while visible; unmounted entirely once fully hidden.',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof AnimatedVisibility>;

type Story = StoryObj<typeof AnimatedVisibility>;

export const Example: Story = {
	args: {
		visibility: AnimatedVisibility.VISIBLE,
	},
	render: (args) => (
		<AnimatedVisibility visibility={args.visibility}>
			<Tile flush>
				<Box padding={40}>Visible</Box>
			</Tile>
		</AnimatedVisibility>
	),
};
