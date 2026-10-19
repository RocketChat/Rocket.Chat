import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '../Button';
import Box from './Box';

export default {
	title: 'Layout/Box/is',
	component: Box,
} satisfies Meta<typeof Box>;

type Story = StoryObj<typeof Box>;

export const IsButton: Story = {
	name: 'is Button',
	args: {
		is: Button,
		children: 'A Box rendering a Button',
	},
};

export const IsSpan: Story = {
	name: 'is span',
	args: {
		is: 'span',
		children: 'A Box rendering a span',
	},
};

export const IsH4: Story = {
	name: 'is h4',
	args: {
		is: 'h4',
		children: 'A Box rendering a h4',
	},
};
