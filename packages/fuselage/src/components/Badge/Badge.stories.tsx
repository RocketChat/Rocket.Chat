import type { Meta, StoryObj } from '@storybook/react';

import { Box } from '../Box';
import Badge from './Badge';

export default {
	title: 'Data Display/Badge',
	component: Badge,
	parameters: {
		docs: {
			usage: `
- Pick the \`variant\` by the type of event, not by color: \`primary\` for a thread reply, \`danger\` for a mention of the user.
- Keep the content to 3 characters or fewer; show "99+" for anything above 99.
- Leave the badge empty and set \`small\` to signal only that something new exists, or when the count can't be shown.
`,
		},
	},
	argTypes: {
		children: {
			control: 'text',
			table: { category: 'Content' },
		},
		title: {
			control: 'text',
			table: { category: 'Content' },
		},
		variant: {
			control: 'select',
			options: ['secondary', 'primary', 'danger', 'warning'],
			table: { category: 'Kind', defaultValue: { summary: 'secondary' } },
		},
		small: {
			control: 'boolean',
			table: { category: 'Size' },
		},
		is: {
			control: false,
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
			{(
				[
					[
						'secondary',
						<Badge key='secondary' variant='secondary'>
							99
						</Badge>,
					],
					[
						'primary',
						<Badge key='primary' variant='primary'>
							99
						</Badge>,
					],
					[
						'danger',
						<Badge key='danger' variant='danger'>
							99
						</Badge>,
					],
					[
						'warning',
						<Badge key='warning' variant='warning'>
							99
						</Badge>,
					],
				] as const
			).map(([label, badge]) => (
				<Box key={label} display='flex' flexDirection='column' alignItems='center' gap='x4'>
					{badge}
					<Box fontScale='c1' color='hint'>
						{label}
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
