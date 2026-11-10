import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Box } from '../Box';
import Chevron from './Chevron';

export default {
	title: 'Data Display/Chevron',
	component: Chevron,
	argTypes: {
		up: {
			control: 'boolean',
			description: 'Points the chevron upward.',
			table: { category: 'Direction' },
		},
		right: {
			control: 'boolean',
			description: 'Points the chevron rightward.',
			table: { category: 'Direction' },
		},
		down: {
			control: 'boolean',
			description: 'Points the chevron downward (default direction).',
			table: { category: 'Direction' },
		},
		left: {
			control: 'boolean',
			description: 'Points the chevron leftward.',
			table: { category: 'Direction' },
		},
		top: {
			control: 'boolean',
			description: 'Declared on the component type but currently unused by the rendered output.',
			table: { category: 'Direction' },
		},
		bottom: {
			control: 'boolean',
			description: 'Declared on the component type but currently unused by the rendered output.',
			table: { category: 'Direction' },
		},
		size: {
			control: 'text',
			description: 'Icon size, forwarded to the underlying `Icon`.',
			table: { category: 'Size' },
		},
	},
} satisfies Meta<typeof Chevron>;

type Story = StoryObj<typeof Chevron>;

export const Default: Story = {
	args: {
		size: 40,
	},
};

export const Up: Story = {
	args: {
		size: 40,
		up: true,
	},
};

export const Right: Story = {
	args: {
		size: 40,
		right: true,
	},
};

export const Down: Story = {
	args: {
		size: 40,
		down: true,
	},
};

export const Left: Story = {
	args: {
		size: 40,
		left: true,
	},
};

export const Size: Story = {
	render: () => (
		<Box display='flex' alignItems='center'>
			<Chevron size='x2' />
			<Chevron size='x4' />
			<Chevron size='x8' />
			<Chevron size='x16' />
			<Chevron size='x20' />
			<Chevron size='x24' />
			<Chevron size='x32' />
			<Chevron size='x40' />
		</Box>
	),
};
