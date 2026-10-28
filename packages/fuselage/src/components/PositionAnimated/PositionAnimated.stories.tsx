import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';

import { AnimatedVisibility } from '../AnimatedVisibility';
import { Box } from '../Box';
import { Tile } from '../Tile';
import PositionAnimated from './PositionAnimated';

export default {
	title: 'Layout/PositionAnimated',
	component: PositionAnimated,
	parameters: {
		layout: 'centered',
	},
	args: {
		visible: AnimatedVisibility.VISIBLE,
	},
	argTypes: {
		anchor: {
			control: false,
			description: 'Ref to the anchor element the positioned content is placed relative to.',
			table: { category: 'Positioning' },
		},
		placement: {
			control: 'select',
			options: [
				'top-start',
				'top-middle',
				'top-end',
				'bottom-start',
				'bottom-middle',
				'bottom-end',
				'right-start',
				'right-middle',
				'right-end',
				'left-start',
				'left-middle',
				'left-end',
			],
			description: 'Where the positioned element is placed relative to the anchor.',
			table: { category: 'Positioning' },
		},
		margin: {
			control: 'number',
			description: 'Gap, in pixels, kept between the anchor and the positioned element.',
			table: { category: 'Positioning' },
		},
		visible: {
			control: 'select',
			options: ['hidden', 'visible', 'hiding', 'unhiding'],
			description: 'Visibility/transition state applied to the positioned element via `AnimatedVisibility`.',
			table: { category: 'State' },
		},
		children: {
			control: false,
			description: 'Element rendered and positioned relative to the anchor.',
			table: { category: 'Content' },
		},
	},
	render: (args) => {
		const ref = useRef<HTMLElement>(null);

		return (
			<>
				<Tile flush ref={ref}>
					<Box padding={12}>Anchor element</Box>
				</Tile>
				<PositionAnimated {...args} anchor={ref}>
					<Tile>Positioned element</Tile>
				</PositionAnimated>
			</>
		);
	},
} satisfies Meta<typeof PositionAnimated>;

type Story = StoryObj<typeof PositionAnimated>;

export const TopStart: Story = {
	args: { placement: 'top-start' },
};

export const TopMiddle: Story = {
	args: { placement: 'top-middle' },
};

export const TopEnd: Story = {
	args: { placement: 'top-end' },
};

export const BottomStart: Story = {
	args: { placement: 'bottom-start' },
};

export const BottomMiddle: Story = {
	args: { placement: 'bottom-middle' },
};

export const BottomEnd: Story = {
	args: { placement: 'bottom-end' },
};

export const RightStart: Story = {
	args: { placement: 'right-start' },
};

export const RightMiddle: Story = {
	args: { placement: 'right-middle' },
};

export const RightEnd: Story = {
	args: { placement: 'right-end' },
};

export const LeftStart: Story = {
	args: { placement: 'left-start' },
};

export const LeftMiddle: Story = {
	args: { placement: 'left-middle' },
};

export const LeftEnd: Story = {
	args: { placement: 'left-end' },
};
