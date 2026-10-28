import type { Meta, StoryObj } from '@storybook/react-vite';

import { Box } from '../Box';
import { IconButton } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import Divider from './Divider';

export default {
	title: 'Data Display/Divider',
	component: Divider,
	parameters: {
		docs: {
			description: {
				component:
					'Separates sections of content.\n\n' +
					'**Rules**\n' +
					'- Use inset to separate related content within a wrapper.\n' +
					'- For a full-width stroke (e.g. separating a header from page content), use a border, not a divider.\n' +
					'- Vertical dividers are used between things like a menu and composer; horizontal + text is used e.g. on a login page.',
			},
		},
	},
	argTypes: {
		variation: {
			control: 'select',
			options: ['danger', 'light'],
			description: 'Color variation of the divider.',
			table: { category: 'Kind' },
		},
		vertical: {
			control: 'boolean',
			description: 'Renders the divider along the vertical axis instead of horizontal.',
			table: { category: 'Layout' },
		},
		flush: {
			control: 'boolean',
			description: "Removes the divider's own margin; the container spaces it instead.",
			table: { category: 'Layout' },
		},
		small: {
			control: 'boolean',
			description: 'Vertical only: uses a 4px inline margin instead of 8px.',
			table: { category: 'Layout' },
		},
		stretch: {
			control: 'boolean',
			description: 'Vertical only: grows to the height of its container instead of 20px.',
			table: { category: 'Layout' },
		},
		children: {
			control: 'text',
			description: 'Text rendered inside the divider; when set, the divider renders as a labeled separator instead of a plain `hr`.',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof Divider>;

type Story = StoryObj<typeof Divider>;

export const Default: Story = {};

export const WithText: Story = {
	args: {
		children: 'Divider',
	},
};

export const Vertical: Story = {
	args: {
		vertical: true,
	},
};

export const AsButtonSeparator: Story = {
	render: () => (
		<ButtonGroup>
			<IconButton size='small' icon='phone' />
			<Divider vertical />
			<IconButton size='small' icon='user' />
		</ButtonGroup>
	),
};

export const Flush: Story = {
	render: () => (
		<Box display='flex' flexDirection='column' gap={16}>
			<Box>Section</Box>
			<Divider flush />
			<Box>Section</Box>
		</Box>
	),
};

export const Light: Story = {
	args: {
		variation: 'light',
	},
};

export const VerticalSmall: Story = {
	render: () => (
		<ButtonGroup small>
			<IconButton size='small' icon='emoji' />
			<Divider vertical small />
			<IconButton size='small' icon='bold' />
		</ButtonGroup>
	),
};

export const VerticalStretch: Story = {
	render: () => (
		<Box display='flex' alignItems='center' height='x80'>
			<Box>Before</Box>
			<Divider vertical stretch />
			<Box>After</Box>
		</Box>
	),
};
