import type { Meta, StoryObj } from '@storybook/react-webpack5';
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
