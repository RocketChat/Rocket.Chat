import { css } from '@rocket.chat/css-in-js';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { action } from 'storybook/actions';

import { useStyle } from '../../hooks/useStyle';
import { Box } from '../Box';
import { Tile } from '../Tile';
import Scrollable from './Scrollable';

const ScrollingTile = ({ maxWidth, height, children }: { maxWidth?: string; height?: number; children: ReactNode }) => {
	const className = useStyle(css`
		${maxWidth !== undefined && `max-width: ${maxWidth};`}
		${height !== undefined && `height: ${height}px;`}
	`);

	return (
		<Tile flush className={className}>
			{children}
		</Tile>
	);
};

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
		<ScrollingTile maxWidth='100%' height={100}>
			<Scrollable>
				<Box width='full' height='full'>
					<Box width='200%' height='1000%' />
				</Box>
			</Scrollable>
		</ScrollingTile>
	),
};

export const HorizontalScrolling: Story = {
	render: () => (
		<ScrollingTile maxWidth='100%'>
			<Scrollable horizontal>
				<Box width='full' height='full'>
					<Box width='200%' height={100} />
				</Box>
			</Scrollable>
		</ScrollingTile>
	),
};

export const VerticalScrolling: Story = {
	render: () => (
		<ScrollingTile height={100}>
			<Scrollable vertical>
				<Box width='full' height='full'>
					<Box height='1000%' />
				</Box>
			</Scrollable>
		</ScrollingTile>
	),
};

export const SmoothScrolling: Story = {
	render: () => (
		<ScrollingTile height={100}>
			<Scrollable smooth>
				<Box width='full' height='full'>
					<Box height='1000%' />
				</Box>
			</Scrollable>
		</ScrollingTile>
	),
};

export const OnScrollContentEvent: Story = {
	render: () => (
		<ScrollingTile height={100}>
			<Scrollable onScrollContent={action('scrollContent')}>
				<Box width='full' height='full'>
					<Box height='1000%' />
				</Box>
			</Scrollable>
		</ScrollingTile>
	),
};
