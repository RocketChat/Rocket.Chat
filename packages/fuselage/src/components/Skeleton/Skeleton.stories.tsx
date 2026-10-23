import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Box } from '../Box';
import Skeleton from './Skeleton';

export default {
	title: 'Layout/Skeleton',
	component: Skeleton,
	parameters: {
		docs: {
			description: {
				component:
					'A visual loading indicator, used to indicate in-progress loading.\n\n' +
					'**Rules**\n' +
					'- Pair the skeleton with the content that is about to appear, matching its shape.',
			},
		},
	},
	argTypes: {
		variant: {
			control: 'select',
			options: ['text', 'rect', 'circle'],
			description: 'Shape of the skeleton placeholder.',
		},
		inverted: {
			control: 'boolean',
			description: 'Whether the placeholder sits on a dark surface, such as a tooltip.',
		},
	},
} satisfies Meta<typeof Skeleton>;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {};

export const RectVariant: Story = {
	args: {
		variant: 'rect',
		width: '50%',
		height: 100,
	},
};

export const CircleVariant: Story = {
	args: {
		variant: 'circle',
		width: 16,
		height: 16,
	},
};

export const TextVariant: Story = {
	args: {
		variant: 'text',
	},
};

export const Inverted: Story = {
	args: {
		inverted: true,
		width: 'x200',
	},
	decorators: [
		(Story) => (
			<Box padding={8} backgroundColor='surface-dark'>
				<Story />
			</Box>
		),
	],
};
