import type { Meta, StoryFn, StoryObj } from '@storybook/react';

import { Button, IconButton } from '../Button';
import ButtonGroup from './ButtonGroup';

export default {
	title: 'Inputs/ButtonGroup',
	component: ButtonGroup,
	parameters: {
		docs: {
			usage: `
- Group two or more buttons that give access to related, frequently performed actions; a lone button needs no group.
- Make the button for the next step \`primary\` when that step is evident. When it is unclear, keep every button \`secondary\`, so attention doesn't go where the user may not want to act.
`,
		},
	},
	argTypes: {
		align: {
			control: 'select',
			options: ['start', 'center', 'end'],
			table: { category: 'Layout', defaultValue: { summary: 'start' } },
		},
		stretch: {
			control: 'select',
			options: [false, true, 'equal'],
			table: { category: 'Layout' },
		},
		wrap: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		vertical: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		small: {
			control: 'boolean',
			table: { category: 'Spacing' },
		},
		large: {
			control: 'boolean',
			table: { category: 'Spacing' },
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
	parameters: {
		docs: {
			description: {
				story: 'Only the gap between the buttons changes.',
			},
		},
	},
	args: {
		large: true,
	},
};

export const Small: Story = {
	render: Template,
	parameters: {
		docs: {
			description: {
				story: 'Only the gap between the buttons changes.',
			},
		},
	},
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
	parameters: {
		docs: {
			description: {
				story: 'The square button keeps its size; the others share the rest of the row equally.',
			},
		},
	},
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
