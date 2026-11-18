import type { Meta, StoryObj } from '@storybook/react';

import { Box } from '../Box';
import { Option } from '../Option';
import PopoverSurface from './PopoverSurface';

const options = Array.from({ length: 30 }, (_, i) => <Option key={i} label={`Option ${i + 1}`} />);

export default {
	title: 'Layout/PopoverSurface',
	component: PopoverSurface,
	parameters: {
		docs: {
			usage: `
- Keep position, offset and stacking on the positioner (a \`Box\` or \`usePosition\`), not on the surface.
`,
		},
	},
	argTypes: {
		maxHeight: {
			control: 'inline-radio',
			options: [undefined, 'half-screen', 'most-of-screen'],
		},
		flush: {
			control: 'boolean',
		},
		elevation: {
			control: 'inline-radio',
			options: ['1', '2'],
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
