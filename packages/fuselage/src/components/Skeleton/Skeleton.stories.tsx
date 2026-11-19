import type { Meta, StoryObj } from '@storybook/react';

import { Box } from '../Box';
import Skeleton from './Skeleton';

export default {
	title: 'Layout/Skeleton',
	component: Skeleton,
	parameters: {
		docs: {
			usage: `
- Pair the skeleton with the content about to appear: match its shape with \`variant\` and its size with \`width\` and \`height\`.
`,
		},
	},
	argTypes: {
		variant: {
			control: 'select',
			options: ['text', 'rect', 'circle'],
		},
		inverted: {
			control: 'boolean',
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
