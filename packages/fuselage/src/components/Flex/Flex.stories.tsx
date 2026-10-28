import type { Meta, StoryObj } from '@storybook/react-vite';

import { Box } from '../Box';
import { Tile } from '../Tile';
import FlexContainer from './FlexContainer';
import FlexItem from './FlexItem';

export default {
	title: 'Layout/Flex',
	component: FlexContainer,
	subcomponents: {
		FlexItem,
	},
	argTypes: {
		inline: {
			control: 'boolean',
			description: 'Renders the container as `inline-flex` instead of `flex` (only applied when `display` is not otherwise set).',
			table: { category: 'Layout' },
		},
		direction: {
			control: 'select',
			options: ['row', 'row-reverse', 'column', 'column-reverse'],
			description: 'Direction the flex items are laid out in.',
			table: { category: 'Layout' },
		},
		wrap: {
			control: 'select',
			options: ['no-wrap', 'wrap', 'wrap-reverse'],
			description: 'Whether flex items wrap onto multiple lines.',
			table: { category: 'Layout' },
		},
		alignItems: {
			control: 'select',
			options: ['stretch', 'start', 'center', 'end', 'baseline'],
			description: 'Alignment of items along the cross axis.',
			table: { category: 'Layout' },
		},
		alignContent: {
			control: 'select',
			options: ['start', 'center', 'end', 'space-between', 'space-around'],
			description: 'Alignment of wrapped lines along the cross axis when there is extra space.',
			table: { category: 'Layout' },
		},
		justifyContent: {
			control: 'select',
			options: ['start', 'center', 'end', 'space-between', 'space-around'],
			description: 'Alignment of items along the main axis.',
			table: { category: 'Layout' },
		},
	},
} satisfies Meta<typeof FlexContainer>;

type Story = StoryObj<typeof FlexContainer>;

export const Example: Story = {
	render: () => (
		<FlexContainer>
			<Tile>
				{Array.from({ length: 3 }, (_, i) => (
					<FlexItem key={i}>
						<Tile>#{i + 1}</Tile>
					</FlexItem>
				))}
			</Tile>
		</FlexContainer>
	),
};

export const Direction: Story = {
	render: () => (
		<FlexContainer direction='row-reverse'>
			<Tile>
				{Array.from({ length: 3 }, (_, i) => (
					<FlexItem key={i}>
						<Tile>#{i + 1}</Tile>
					</FlexItem>
				))}
			</Tile>
		</FlexContainer>
	),
};

export const Wrap: Story = {
	render: () => (
		<FlexContainer wrap='wrap'>
			<Tile>
				{Array.from({ length: 12 }, (_, i) => (
					<FlexItem key={i}>
						<Tile>#{i + 1}</Tile>
					</FlexItem>
				))}
			</Tile>
		</FlexContainer>
	),
};

export const JustifyContent: Story = {
	render: () => (
		<FlexContainer justifyContent='space-around'>
			<Tile>
				{Array.from({ length: 3 }, (_, i) => (
					<FlexItem key={i}>
						<Tile>#{i + 1}</Tile>
					</FlexItem>
				))}
			</Tile>
		</FlexContainer>
	),
};

export const AlignItems: Story = {
	render: () => (
		<FlexContainer alignItems='end'>
			<Tile>
				{Array.from({ length: 3 }, (_, i) => (
					<FlexItem key={i}>
						<Tile style={{ height: i * 100 }}>#{i + 1}</Tile>
					</FlexItem>
				))}
			</Tile>
		</FlexContainer>
	),
};

export const AlignContent: Story = {
	render: () => (
		<FlexContainer wrap='wrap' alignContent='end'>
			<Tile style={{ minHeight: 400 }}>
				{Array.from({ length: 12 }, (_, i) => (
					<FlexItem key={i}>
						<Tile>#{i + 1}</Tile>
					</FlexItem>
				))}
			</Tile>
		</FlexContainer>
	),
};

export const Order: Story = {
	render: () => (
		<FlexContainer>
			<Tile>
				<FlexItem>
					<Tile>#1</Tile>
				</FlexItem>
				<FlexItem order={1}>
					<Tile>#2</Tile>
				</FlexItem>
				<FlexItem>
					<Tile>#3</Tile>
				</FlexItem>
			</Tile>
		</FlexContainer>
	),
};

export const Grow: Story = {
	render: () => (
		<FlexContainer>
			<Tile>
				<FlexItem>
					<Tile>#1</Tile>
				</FlexItem>
				<FlexItem grow={1}>
					<Tile>#2</Tile>
				</FlexItem>
				<FlexItem>
					<Tile>#3</Tile>
				</FlexItem>
			</Tile>
		</FlexContainer>
	),
};

export const Shrink: Story = {
	render: () => (
		<FlexContainer>
			<Tile>
				<FlexItem>
					<Tile>#1</Tile>
				</FlexItem>
				<FlexItem shrink={1}>
					<Box width='full'>
						<Tile>#2</Tile>
					</Box>
				</FlexItem>
				<FlexItem>
					<Tile>#3</Tile>
				</FlexItem>
			</Tile>
		</FlexContainer>
	),
};

export const Basis: Story = {
	render: () => (
		<FlexContainer>
			<Tile>
				<FlexItem>
					<Tile>#1</Tile>
				</FlexItem>
				<FlexItem basis='400px'>
					<Tile>#2</Tile>
				</FlexItem>
				<FlexItem>
					<Tile>#3</Tile>
				</FlexItem>
			</Tile>
		</FlexContainer>
	),
};

export const Align: Story = {
	render: () => (
		<FlexContainer alignItems='center'>
			<Tile style={{ minHeight: 400 }}>
				<FlexItem>
					<Tile>#1</Tile>
				</FlexItem>
				<FlexItem align='end'>
					<Tile>#2</Tile>
				</FlexItem>
				<FlexItem>
					<Tile>#3</Tile>
				</FlexItem>
			</Tile>
		</FlexContainer>
	),
};
