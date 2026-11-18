import type { Meta, StoryObj } from '@storybook/react';

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
				<Box display='flex'>
					<Button>With margins</Button>
				</Box>
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
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins all='x4'>
								<Box>
									<Tile>x4</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins all='x8'>
								<Box>
									<Tile>x8</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins all='x16'>
								<Box>
									<Tile>x16</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins all='x24'>
								<Box>
									<Tile>x24</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins all='x32'>
								<Box>
									<Tile>x32</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins all='x40'>
								<Box>
									<Tile>x40</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
			</Margins>
		</Box>
	),
};

export const BlockProp: Story = {
	name: 'block prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins block='x4'>
								<Box>
									<Tile>x4</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins block='x8'>
								<Box>
									<Tile>x8</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins block='x16'>
								<Box>
									<Tile>x16</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins block='x24'>
								<Box>
									<Tile>x24</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins block='x32'>
								<Box>
									<Tile>x32</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins block='x40'>
								<Box>
									<Tile>x40</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
			</Margins>
		</Box>
	),
};

export const BlockStartProp: Story = {
	name: 'blockStart prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins blockStart='x4'>
								<Box>
									<Tile>x4</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins blockStart='x8'>
								<Box>
									<Tile>x8</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins blockStart='x16'>
								<Box>
									<Tile>x16</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins blockStart='x24'>
								<Box>
									<Tile>x24</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins blockStart='x32'>
								<Box>
									<Tile>x32</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins blockStart='x40'>
								<Box>
									<Tile>x40</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
			</Margins>
		</Box>
	),
};

export const BlockEndProp: Story = {
	name: 'blockEnd prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins blockEnd='x4'>
								<Box>
									<Tile>x4</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins blockEnd='x8'>
								<Box>
									<Tile>x8</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins blockEnd='x16'>
								<Box>
									<Tile>x16</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins blockEnd='x24'>
								<Box>
									<Tile>x24</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins blockEnd='x32'>
								<Box>
									<Tile>x32</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins blockEnd='x40'>
								<Box>
									<Tile>x40</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
			</Margins>
		</Box>
	),
};

export const InlineProp: Story = {
	name: 'inline prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inline='x4'>
								<Box>
									<Tile>x4</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inline='x8'>
								<Box>
									<Tile>x8</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inline='x16'>
								<Box>
									<Tile>x16</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inline='x24'>
								<Box>
									<Tile>x24</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inline='x32'>
								<Box>
									<Tile>x32</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inline='x40'>
								<Box>
									<Tile>x40</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
			</Margins>
		</Box>
	),
};

export const InlineStartProp: Story = {
	name: 'inlineStart prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inlineStart='x4'>
								<Box>
									<Tile>x4</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inlineStart='x8'>
								<Box>
									<Tile>x8</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inlineStart='x16'>
								<Box>
									<Tile>x16</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inlineStart='x24'>
								<Box>
									<Tile>x24</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inlineStart='x32'>
								<Box>
									<Tile>x32</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inlineStart='x40'>
								<Box>
									<Tile>x40</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
			</Margins>
		</Box>
	),
};

export const InlineEndProp: Story = {
	name: 'inlineEnd prop',
	render: () => (
		<Box display='flex' alignItems='center'>
			<Margins all='x8'>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inlineEnd='x4'>
								<Box>
									<Tile>x4</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inlineEnd='x8'>
								<Box>
									<Tile>x8</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inlineEnd='x16'>
								<Box>
									<Tile>x16</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inlineEnd='x24'>
								<Box>
									<Tile>x24</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inlineEnd='x32'>
								<Box>
									<Tile>x32</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
				<Box>
					<Tile flush>
						<Box display='flex'>
							<Margins inlineEnd='x40'>
								<Box>
									<Tile>x40</Tile>
								</Box>
							</Margins>
						</Box>
					</Tile>
				</Box>
			</Margins>
		</Box>
	),
};

export const WithNegativeValues: Story = {
	name: 'With negative values',
	render: () => (
		<Box display='flex' flexDirection='column' alignItems='center'>
			<Margins all='x20'>
				<Box>
					<Tile>
						<Margins inline='-x40'>
							<Box>
								<Tile flush>
									<Box display='flex'>
										<Margins inline='x40'>
											<Box>
												<Tile flush>
													<Box padding={40} />
												</Tile>
											</Box>
											<Box>
												<Tile flush>
													<Box padding={40} />
												</Tile>
											</Box>
											<Box>
												<Tile flush>
													<Box padding={40} />
												</Tile>
											</Box>
											<Box>
												<Tile flush>
													<Box padding={40} />
												</Tile>
											</Box>
										</Margins>
									</Box>
								</Tile>
							</Box>
						</Margins>
					</Tile>
				</Box>
				<Box>
					<Tile>
						<Margins block='-x40'>
							<Box>
								<Tile flush>
									<Box display='flex'>
										<Margins block='x40'>
											<Box>
												<Tile flush>
													<Box padding={40} />
												</Tile>
											</Box>
											<Box>
												<Tile flush>
													<Box padding={40} />
												</Tile>
											</Box>
											<Box>
												<Tile flush>
													<Box padding={40} />
												</Tile>
											</Box>
											<Box>
												<Tile flush>
													<Box padding={40} />
												</Tile>
											</Box>
										</Margins>
									</Box>
								</Tile>
							</Box>
						</Margins>
					</Tile>
				</Box>
			</Margins>
		</Box>
	),
};

export const WithAutoValue: Story = {
	name: 'With auto value',
	render: () => (
		<Tile>
			<Box display='flex'>
				<Tile flush>
					<Box padding={40} />
				</Tile>
				<Margins inline='auto'>
					<Box>
						<Tile flush>
							<Box padding={40} />
						</Tile>
					</Box>
				</Margins>
				<Tile flush>
					<Box padding={40} />
				</Tile>
			</Box>
		</Tile>
	),
};

export const WithNoneValue: Story = {
	name: 'With none value',
	render: () => (
		<Tile>
			<Box display='flex'>
				<Margins inline='x16'>
					<Box>
						<Tile flush>
							<Box padding={40} />
						</Tile>
					</Box>
				</Margins>
				<Margins inline='none'>
					<Box>
						<Tile flush>
							<Box padding={40} />
						</Tile>
					</Box>
					<Box>
						<Tile flush>
							<Box padding={40} />
						</Tile>
					</Box>
				</Margins>
				<Margins inline='x16'>
					<Box>
						<Tile flush>
							<Box padding={40} />
						</Tile>
					</Box>
				</Margins>
			</Box>
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
