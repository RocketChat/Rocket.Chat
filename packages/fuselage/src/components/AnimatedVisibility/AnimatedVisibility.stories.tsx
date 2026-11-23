import type { Meta, StoryObj } from '@storybook/react';

import AnimatedVisibility from './AnimatedVisibility.js';
import { Box } from '../Box/index.js';
import { Tile } from '../Tile/index.js';

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
			description: 'Content to render while visible; unmounted entirely once fully hidden.',
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
