import type { Meta, StoryObj } from '@storybook/react-vite';

import Tile from './Tile';

export default {
	title: 'Containers/Tile',
	component: Tile,
	argTypes: {
		children: {
			control: 'text',
			description: 'Tile content.',
		},
		elevation: {
			control: 'select',
			options: ['0', '1', '2', '1nb', '2nb'],
			description: 'Shadow depth applied to the tile.',
			table: { defaultValue: { summary: '1' } },
		},
		flush: {
			control: 'boolean',
			description: 'Drops the default padding.',
		},
	},
} satisfies Meta<typeof Tile>;

type Story = StoryObj<typeof Tile>;

export const Default: Story = {
	args: {
		children: 'Content',
	},
};

export const Elevation0: Story = {
	args: {
		elevation: '0',
	},
};

export const Elevation1: Story = {
	args: {
		elevation: '1',
	},
};

export const Elevation2: Story = {
	args: {
		elevation: '2',
	},
};

export const Flush: Story = {
	args: {
		flush: true,
		children: 'Content',
	},
};
