import type { Meta, StoryObj } from '@storybook/react';

import { Box } from '../Box';
import { IconButton } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import Divider from './Divider';

export default {
	title: 'Data Display/Divider',
	component: Divider,
	parameters: {
		docs: {
			usage: `
- Separate related content inside a container with a \`Divider\`.
- For a full-width stroke, such as between a header and the page content, use a border instead.
- Use a \`vertical\` divider between elements side by side, such as a menu and the composer; label a horizontal one with \`children\`, as on the login page.
`,
		},
	},
	argTypes: {
		variation: {
			control: 'select',
			options: ['danger', 'light'],
			table: { category: 'Kind' },
		},
		vertical: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		flush: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		small: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		stretch: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		children: {
			control: 'text',
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
