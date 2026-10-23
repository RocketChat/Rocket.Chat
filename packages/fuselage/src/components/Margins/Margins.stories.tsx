import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Box } from '../Box';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { Tile } from '../Tile';
import Margins from './Margins';

export default {
	title: 'Layout/Margins',
	component: Margins,
	parameters: {
		docs: {
			description: {
				component: 'Add margins to the wrapped component.',
			},
		},
	},
	argTypes: {
		all: {
			control: 'text',
			description: 'Margin applied on every side (a Box `margin` value).',
			table: { category: 'Spacing' },
		},
		block: {
			control: 'text',
			description: 'Margin applied on the block start and end sides.',
			table: { category: 'Spacing' },
		},
		blockStart: {
			control: 'text',
			description: 'Margin applied on the block-start side.',
			table: { category: 'Spacing' },
		},
		blockEnd: {
			control: 'text',
			description: 'Margin applied on the block-end side.',
			table: { category: 'Spacing' },
		},
		inline: {
			control: 'text',
			description: 'Margin applied on the inline start and end sides.',
			table: { category: 'Spacing' },
		},
		inlineStart: {
			control: 'text',
			description: 'Margin applied on the inline-start side.',
			table: { category: 'Spacing' },
		},
		inlineEnd: {
			control: 'text',
			description: 'Margin applied on the inline-end side.',
			table: { category: 'Spacing' },
		},
	},
} satisfies Meta<typeof Margins>;

type Story = StoryObj<typeof Margins>;

export const Example: Story = {
	args: {
		all: 'x32',
	},
	render: (args) => (
		<ButtonGroup>
			<Button>Without margins</Button>
			<Margins {...args}>
				<Button>With margins</Button>
			</Margins>
			<Button>Without margins</Button>
			<Button>Without margins</Button>
		</ButtonGroup>
	),
};

export const AllProp: Story = {
	name: 'all prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Tile display='flex' padding='none'>
					<Margins all='x4'>
						<Tile>x4</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins all='x8'>
						<Tile>x8</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins all='x16'>
						<Tile>x16</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins all='x24'>
						<Tile>x24</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins all='x32'>
						<Tile>x32</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins all='x40'>
						<Tile>x40</Tile>
					</Margins>
				</Tile>
			</Margins>
		</Box>
	),
};

export const BlockProp: Story = {
	name: 'block prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Tile display='flex' padding='none'>
					<Margins block='x4'>
						<Tile>x4</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins block='x8'>
						<Tile>x8</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins block='x16'>
						<Tile>x16</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins block='x24'>
						<Tile>x24</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins block='x32'>
						<Tile>x32</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins block='x40'>
						<Tile>x40</Tile>
					</Margins>
				</Tile>
			</Margins>
		</Box>
	),
};

export const BlockStartProp: Story = {
	name: 'blockStart prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Tile display='flex' padding='none'>
					<Margins blockStart='x4'>
						<Tile>x4</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins blockStart='x8'>
						<Tile>x8</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins blockStart='x16'>
						<Tile>x16</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins blockStart='x24'>
						<Tile>x24</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins blockStart='x32'>
						<Tile>x32</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins blockStart='x40'>
						<Tile>x40</Tile>
					</Margins>
				</Tile>
			</Margins>
		</Box>
	),
};

export const BlockEndProp: Story = {
	name: 'blockEnd prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Tile display='flex' padding='none'>
					<Margins blockEnd='x4'>
						<Tile>x4</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins blockEnd='x8'>
						<Tile>x8</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins blockEnd='x16'>
						<Tile>x16</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins blockEnd='x24'>
						<Tile>x24</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins blockEnd='x32'>
						<Tile>x32</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins blockEnd='x40'>
						<Tile>x40</Tile>
					</Margins>
				</Tile>
			</Margins>
		</Box>
	),
};

export const InlineProp: Story = {
	name: 'inline prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Tile display='flex' padding='none'>
					<Margins inline='x4'>
						<Tile>x4</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inline='x8'>
						<Tile>x8</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inline='x16'>
						<Tile>x16</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inline='x24'>
						<Tile>x24</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inline='x32'>
						<Tile>x32</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inline='x40'>
						<Tile>x40</Tile>
					</Margins>
				</Tile>
			</Margins>
		</Box>
	),
};

export const InlineStartProp: Story = {
	name: 'inlineStart prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Tile display='flex' padding='none'>
					<Margins inlineStart='x4'>
						<Tile>x4</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inlineStart='x8'>
						<Tile>x8</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inlineStart='x16'>
						<Tile>x16</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inlineStart='x24'>
						<Tile>x24</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inlineStart='x32'>
						<Tile>x32</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inlineStart='x40'>
						<Tile>x40</Tile>
					</Margins>
				</Tile>
			</Margins>
		</Box>
	),
};

export const InlineEndProp: Story = {
	name: 'inlineEnd prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Tile display='flex' padding='none'>
					<Margins inlineEnd='x4'>
						<Tile>x4</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inlineEnd='x8'>
						<Tile>x8</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inlineEnd='x16'>
						<Tile>x16</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inlineEnd='x24'>
						<Tile>x24</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inlineEnd='x32'>
						<Tile>x32</Tile>
					</Margins>
				</Tile>
				<Tile display='flex' padding='none'>
					<Margins inlineEnd='x40'>
						<Tile>x40</Tile>
					</Margins>
				</Tile>
			</Margins>
		</Box>
	),
};

export const WithNegativeValues: Story = {
	name: 'With negative values',
	render: () => (
		<Box display='flex' flexDirection='column' alignItems='center'>
			<Margins all='x20'>
				<Tile>
					<Margins inline='-x40'>
						<Tile display='flex' padding='none'>
							<Margins inline='x40'>
								<Tile padding={40} />
								<Tile padding={40} />
								<Tile padding={40} />
								<Tile padding={40} />
							</Margins>
						</Tile>
					</Margins>
				</Tile>
				<Tile>
					<Margins block='-x40'>
						<Tile display='flex' padding='none'>
							<Margins block='x40'>
								<Tile padding={40} />
								<Tile padding={40} />
								<Tile padding={40} />
								<Tile padding={40} />
							</Margins>
						</Tile>
					</Margins>
				</Tile>
			</Margins>
		</Box>
	),
};

export const WithAutoValue: Story = {
	name: 'With auto value',
	render: () => (
		<Tile display='flex'>
			<Tile padding={40} />
			<Margins inline='auto'>
				<Tile padding={40} />
			</Margins>
			<Tile padding={40} />
		</Tile>
	),
};

export const WithNoneValue: Story = {
	name: 'With none value',
	render: () => (
		<Tile display='flex'>
			<Margins inline='x16'>
				<Tile padding={40} />
			</Margins>
			<Margins inline='none'>
				<Tile padding={40} />
				<Tile padding={40} />
			</Margins>
			<Margins inline='x16'>
				<Tile padding={40} />
			</Margins>
		</Tile>
	),
};

export const WithNonBoxChildren: Story = {
	name: 'With non-Box children',
	render: () => (
		<div style={{ border: '1px solid red' }}>
			<Margins block='x16' inline='x32'>
				<div style={{ border: '1px solid green' }} />
				<div style={{ border: '1px solid blue' }} />
			</Margins>
		</div>
	),
};
