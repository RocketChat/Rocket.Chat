import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Box } from '../Box';
import Badge from './Badge';

export default {
	title: 'Data Display/Badge',
	component: Badge,
	parameters: {
		docs: {
			description: {
				component:
					'Indicates the type and quantity of notifications, highlighting key events and facilitating user navigation.\n\n' +
					'**Rules**\n' +
					'- Pick `variant` by the EVENT semantics it represents (e.g. `primary` for a thread reply, `danger` for a user mention), not by color preference — the options are named by color, but each maps to a specific semantic meaning.\n' +
					'- Never exceed 3 characters; show "99+" for anything above 99.\n' +
					"- Use the small dot variant (empty content) when you only need to signal that something new exists, or when the quantity can't be shown.",
			},
		},
	},
	argTypes: {
		children: {
			control: 'text',
			description: 'Badge content, typically a short label or count.',
			table: { category: 'Content' },
		},
		title: {
			control: 'text',
			description: 'Native `title` attribute shown as a tooltip on hover.',
			table: { category: 'Content' },
		},
		variant: {
			control: 'select',
			options: ['secondary', 'primary', 'danger', 'warning'],
			description: 'Color kind of the badge.',
			table: { category: 'Kind', defaultValue: { summary: 'secondary' } },
		},
		small: {
			control: 'boolean',
			description: 'Renders the badge in a smaller size.',
			table: { category: 'Size' },
		},
		is: {
			control: false,
			description: 'Underlying element or component rendered.',
			table: { category: 'Polymorphism', defaultValue: { summary: 'span' } },
		},
	},
	render: (args) => (
		<Box display='inline-flex'>
			<Badge {...args} />
		</Box>
	),
} satisfies Meta<typeof Badge>;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const Primary: Story = {
	args: {
		variant: 'primary',
	},
};

export const Secondary: Story = {
	args: {
		variant: 'secondary',
	},
};

export const Danger: Story = {
	args: {
		variant: 'danger',
	},
};

export const Warning: Story = {
	args: {
		variant: 'warning',
	},
};

export const WithValue: Story = {
	render: () => (
		<Box display='inline-flex' alignItems='flex-start' gap='x16'>
			{(['secondary', 'primary', 'danger', 'warning'] as const).map((variant) => (
				<Box key={variant} display='flex' flexDirection='column' alignItems='center' gap='x4'>
					<Badge variant={variant}>99</Badge>
					<Box fontScale='c1' color='hint'>
						{variant}
					</Box>
				</Box>
			))}
		</Box>
	),
};

export const Small: Story = {
	args: {
		children: '',
		variant: 'primary',
		small: true,
	},
};
