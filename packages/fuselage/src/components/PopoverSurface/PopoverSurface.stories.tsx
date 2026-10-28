import type { Meta, StoryObj } from '@storybook/react-vite';

import { Box } from '../Box';
import { Option } from '../Option';
import PopoverSurface from './PopoverSurface';

const options = Array.from({ length: 30 }, (_, i) => <Option key={i} label={`Option ${i + 1}`} />);

export default {
	title: 'Layout/PopoverSurface',
	component: PopoverSurface,
	parameters: {
		docs: {
			description: {
				component:
					'The raised surface of a dropdown or popover. It fills its positioner and scrolls its content; position, offset and stacking stay on the positioner, a `Box` or `usePosition`.',
			},
		},
	},
	argTypes: {
		maxHeight: {
			control: 'inline-radio',
			options: [undefined, 'half-screen', 'most-of-screen'],
			description: 'Caps the height at 50vh (`half-screen`) or 80vh (`most-of-screen`); without it the surface grows with its content.',
		},
		flush: {
			control: 'boolean',
			description: 'Drops the 12px block padding.',
		},
		elevation: {
			control: 'inline-radio',
			options: ['1', '2'],
			description: 'How far the surface is raised above the page; defaults to `2`.',
		},
	},
	decorators: [
		(Story) => (
			<Box width={240}>
				<Story />
			</Box>
		),
	],
} satisfies Meta<typeof PopoverSurface>;

type Story = StoryObj<typeof PopoverSurface>;

export const Default: Story = {
	args: {
		children: options.slice(0, 5),
	},
};

export const HalfScreen: Story = {
	args: {
		maxHeight: 'half-screen',
		children: options,
	},
};

export const Flush: Story = {
	args: {
		flush: true,
		children: options.slice(0, 5),
	},
};
