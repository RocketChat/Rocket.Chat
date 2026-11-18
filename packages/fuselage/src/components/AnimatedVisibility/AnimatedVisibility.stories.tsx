import type { Meta, StoryObj } from '@storybook/react';

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
			description:
				'Changing it to `visible` slides the children in; changing it to `hidden` slides them out and then unmounts them. Defaults to `hidden`, so nothing renders until it is set.',
			table: { category: 'State' },
		},
		children: {
			control: false,
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
