import type { Meta, StoryObj } from '@storybook/react';

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
		<Tile>
			<FlexContainer>
				<Box>
					{Array.from({ length: 3 }, (_, i) => (
						<FlexItem key={i}>
							<Box>
								<Tile>#{i + 1}</Tile>
							</Box>
						</FlexItem>
					))}
				</Box>
			</FlexContainer>
		</Tile>
	),
};

export const Direction: Story = {
	render: () => (
		<Tile>
			<FlexContainer direction='row-reverse'>
				<Box>
					{Array.from({ length: 3 }, (_, i) => (
						<FlexItem key={i}>
							<Box>
								<Tile>#{i + 1}</Tile>
							</Box>
						</FlexItem>
					))}
				</Box>
			</FlexContainer>
		</Tile>
	),
};

export const Wrap: Story = {
	render: () => (
		<Tile>
			<FlexContainer wrap='wrap'>
				<Box>
					{Array.from({ length: 12 }, (_, i) => (
						<FlexItem key={i}>
							<Box>
								<Tile>#{i + 1}</Tile>
							</Box>
						</FlexItem>
					))}
				</Box>
			</FlexContainer>
		</Tile>
	),
};

export const JustifyContent: Story = {
	render: () => (
		<Tile>
			<FlexContainer justifyContent='space-around'>
				<Box>
					{Array.from({ length: 3 }, (_, i) => (
						<FlexItem key={i}>
							<Box>
								<Tile>#{i + 1}</Tile>
							</Box>
						</FlexItem>
					))}
				</Box>
			</FlexContainer>
		</Tile>
	),
};

export const AlignItems: Story = {
	render: () => (
		<Tile>
			<FlexContainer alignItems='end'>
				<Box>
					{Array.from({ length: 3 }, (_, i) => (
						<FlexItem key={i}>
							<Box>
								<Tile style={{ height: i * 100 }}>#{i + 1}</Tile>
							</Box>
						</FlexItem>
					))}
				</Box>
			</FlexContainer>
		</Tile>
	),
};

export const AlignContent: Story = {
	render: () => (
		<Tile style={{ display: 'flex', minHeight: 400 }}>
			<FlexContainer wrap='wrap' alignContent='end'>
				<Box flexGrow={1}>
					{Array.from({ length: 12 }, (_, i) => (
						<FlexItem key={i}>
							<Box>
								<Tile>#{i + 1}</Tile>
							</Box>
						</FlexItem>
					))}
				</Box>
			</FlexContainer>
		</Tile>
	),
};

export const Order: Story = {
	render: () => (
		<Tile>
			<FlexContainer>
				<Box>
					<FlexItem>
						<Box>
							<Tile>#1</Tile>
						</Box>
					</FlexItem>
					<FlexItem order={1}>
						<Box>
							<Tile>#2</Tile>
						</Box>
					</FlexItem>
					<FlexItem>
						<Box>
							<Tile>#3</Tile>
						</Box>
					</FlexItem>
				</Box>
			</FlexContainer>
		</Tile>
	),
};

export const Grow: Story = {
	render: () => (
		<Tile>
			<FlexContainer>
				<Box>
					<FlexItem>
						<Box>
							<Tile>#1</Tile>
						</Box>
					</FlexItem>
					<FlexItem grow={1}>
						<Box>
							<Tile>#2</Tile>
						</Box>
					</FlexItem>
					<FlexItem>
						<Box>
							<Tile>#3</Tile>
						</Box>
					</FlexItem>
				</Box>
			</FlexContainer>
		</Tile>
	),
};

export const Shrink: Story = {
	render: () => (
		<Tile>
			<FlexContainer>
				<Box>
					<FlexItem>
						<Box>
							<Tile>#1</Tile>
						</Box>
					</FlexItem>
					<FlexItem shrink={1}>
						<Box width='full'>
							<Tile>#2</Tile>
						</Box>
					</FlexItem>
					<FlexItem>
						<Box>
							<Tile>#3</Tile>
						</Box>
					</FlexItem>
				</Box>
			</FlexContainer>
		</Tile>
	),
};

export const Basis: Story = {
	render: () => (
		<Tile>
			<FlexContainer>
				<Box>
					<FlexItem>
						<Box>
							<Tile>#1</Tile>
						</Box>
					</FlexItem>
					<FlexItem basis='400px'>
						<Box>
							<Tile>#2</Tile>
						</Box>
					</FlexItem>
					<FlexItem>
						<Box>
							<Tile>#3</Tile>
						</Box>
					</FlexItem>
				</Box>
			</FlexContainer>
		</Tile>
	),
};

export const Align: Story = {
	render: () => (
		<Tile style={{ display: 'flex', minHeight: 400 }}>
			<FlexContainer alignItems='center'>
				<Box flexGrow={1}>
					<FlexItem>
						<Box>
							<Tile>#1</Tile>
						</Box>
					</FlexItem>
					<FlexItem align='end'>
						<Box>
							<Tile>#2</Tile>
						</Box>
					</FlexItem>
					<FlexItem>
						<Box>
							<Tile>#3</Tile>
						</Box>
					</FlexItem>
				</Box>
			</FlexContainer>
		</Tile>
	),
};
