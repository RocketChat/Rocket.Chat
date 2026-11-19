import type { Meta, StoryFn, StoryObj } from '@storybook/react';

import { Button, IconButton } from '../Button';
import ButtonGroup from './ButtonGroup';

export default {
	title: 'Inputs/ButtonGroup',
	component: ButtonGroup,
	argTypes: {
		align: {
			control: 'select',
			options: ['start', 'center', 'end'],
			description: 'Alignment of the buttons along the main axis.',
			table: { category: 'Layout', defaultValue: { summary: 'start' } },
		},
		stretch: {
			control: 'select',
			options: [false, true, 'equal'],
			description: 'Stretches every button to share the available space; `equal` also gives them the same width.',
			table: { category: 'Layout' },
		},
		wrap: {
			control: 'boolean',
			description: 'Allows buttons to wrap onto multiple lines.',
			table: { category: 'Layout' },
		},
		vertical: {
			control: 'boolean',
			description: 'Stacks the buttons vertically instead of horizontally.',
			table: { category: 'Layout' },
		},
		small: {
			control: 'boolean',
			description: 'Small size scale for the contained buttons.',
			table: { category: 'Size' },
		},
		large: {
			control: 'boolean',
			description: 'Large size scale for the contained buttons.',
			table: { category: 'Size' },
		},
	},
} satisfies Meta<typeof ButtonGroup>;

type Story = StoryObj<typeof ButtonGroup>;

const Template: StoryFn<typeof ButtonGroup> = (args) => (
	<ButtonGroup {...args}>
		<Button>Button 1</Button>
		<Button>Button 2</Button>
		<Button>Button 3</Button>
	</ButtonGroup>
);

export const Default: Story = {
	render: Template,
};

export const Large: Story = {
	render: Template,
	args: {
		large: true,
	},
};

export const Small: Story = {
	render: Template,
	args: {
		small: true,
	},
};

export const Wrap: Story = {
	render: (args) => (
		<ButtonGroup {...args}>
			{Array.from({ length: 20 }, (_, i) => (
				<Button key={i}>Button {i + 1}</Button>
			))}
		</ButtonGroup>
	),
	args: {
		wrap: true,
	},
};

export const Stretch: Story = {
	render: Template,
	args: {
		stretch: true,
	},
};

export const StretchEqual: Story = {
	render: (args) => (
		<ButtonGroup {...args}>
			<Button>Cancel</Button>
			<Button variant='primary'>Add more users</Button>
			<IconButton icon='kebab' variant='secondary' title='More' />
		</ButtonGroup>
	),
	args: {
		stretch: 'equal',
	},
};

export const Vertical: Story = {
	render: Template,
	args: {
		vertical: true,
	},
};

export const VerticalLarge: Story = {
	render: Template,
	args: {
		vertical: true,
		large: true,
	},
};

export const VerticalSmall: Story = {
	render: Template,
	args: {
		vertical: true,
		small: true,
	},
};

export const VerticalStretch: Story = {
	render: Template,
	args: {
		vertical: true,
		stretch: true,
	},
};

export const AlignedAtStart: Story = {
	render: Template,
	args: {
		align: 'start',
	},
};

export const AlignedAtCenter: Story = {
	render: Template,
	args: {
		align: 'center',
	},
};

export const AlignedAtEnd: Story = {
	render: Template,
	args: {
		align: 'end',
	},
};
