import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { Box } from '../Box';
import { Tile } from '../Tile';
import Scrollable from './Scrollable';

export default {
	title: 'Layout/Scrollable',
	component: Scrollable,
	argTypes: {
		horizontal: {
			control: 'boolean',
			table: { category: 'Direction' },
		},
		vertical: {
			control: 'boolean',
			table: { category: 'Direction' },
		},
		smooth: {
			control: 'boolean',
			table: { category: 'Behavior' },
		},
		onScrollContent: {
			control: false,
			table: { category: 'Events' },
		},
		children: {
			control: false,
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof Scrollable>;

type Story = StoryObj<typeof Scrollable>;

export const Default: Story = {
	render: () => (
		<Scrollable>
			<Tile flush style={{ maxWidth: '100%', height: 100 }}>
				<Box width='200%' height='1000%' />
			</Tile>
		</Scrollable>
	),
};

export const HorizontalScrolling: Story = {
	render: () => (
		<Scrollable horizontal>
			<Tile flush style={{ maxWidth: '100%' }}>
				<Box width='200%' height={100} />
			</Tile>
		</Scrollable>
	),
};

export const VerticalScrolling: Story = {
	render: () => (
		<Scrollable vertical>
			<Tile flush style={{ height: 100 }}>
				<Box height='1000%' />
			</Tile>
		</Scrollable>
	),
};

export const SmoothScrolling: Story = {
	render: () => (
		<Scrollable smooth>
			<Tile flush style={{ height: 100 }}>
				<Box height='1000%' />
			</Tile>
		</Scrollable>
	),
};

export const OnScrollContentEvent: Story = {
	render: () => (
		<Scrollable onScrollContent={action('scrollContent')}>
			<Tile flush style={{ height: 100 }}>
				<Box height='1000%' />
			</Tile>
		</Scrollable>
	),
};
