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
			description: 'Forces horizontal-only scrolling (`overflow-x: auto`).',
			table: { category: 'Direction' },
		},
		vertical: {
			control: 'boolean',
			description: 'Forces vertical-only scrolling (`overflow-y: auto`).',
			table: { category: 'Direction' },
		},
		smooth: {
			control: 'boolean',
			description: 'Enables smooth scrolling behavior.',
			table: { category: 'Behavior' },
		},
		onScrollContent: {
			control: false,
			description: 'Called with which edges (top/bottom/left/right) are currently touching whenever the scroll position settles.',
			table: { category: 'Events' },
		},
		children: {
			control: false,
			description: 'Scrollable content; receives the scroll container styling and scroll handler via `BoxTransforms`.',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof Scrollable>;

type Story = StoryObj<typeof Scrollable>;

export const Default: Story = {
	render: () => (
		<Tile flush style={{ maxWidth: '100%', height: 100 }}>
			<Scrollable>
				<Box width='full' height='full'>
					<Box width='200%' height='1000%' />
				</Box>
			</Scrollable>
		</Tile>
	),
};

export const HorizontalScrolling: Story = {
	render: () => (
		<Tile flush style={{ maxWidth: '100%' }}>
			<Scrollable horizontal>
				<Box width='full' height='full'>
					<Box width='200%' height={100} />
				</Box>
			</Scrollable>
		</Tile>
	),
};

export const VerticalScrolling: Story = {
	render: () => (
		<Tile flush style={{ height: 100 }}>
			<Scrollable vertical>
				<Box width='full' height='full'>
					<Box height='1000%' />
				</Box>
			</Scrollable>
		</Tile>
	),
};

export const SmoothScrolling: Story = {
	render: () => (
		<Tile flush style={{ height: 100 }}>
			<Scrollable smooth>
				<Box width='full' height='full'>
					<Box height='1000%' />
				</Box>
			</Scrollable>
		</Tile>
	),
};

export const OnScrollContentEvent: Story = {
	render: () => (
		<Tile flush style={{ height: 100 }}>
			<Scrollable onScrollContent={action('scrollContent')}>
				<Box width='full' height='full'>
					<Box height='1000%' />
				</Box>
			</Scrollable>
		</Tile>
	),
};
