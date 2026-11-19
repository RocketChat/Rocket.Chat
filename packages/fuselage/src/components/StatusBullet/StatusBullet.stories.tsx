import type { Meta, StoryObj } from '@storybook/react';

import { Box } from '../Box';
import StatusBullet from './StatusBullet';

export default {
	title: 'Data Display/StatusBullet',
	component: StatusBullet,
	parameters: {
		docs: {
			usage: `
- Show it next to the user's name, or where users set their own status.
`,
		},
	},
	argTypes: {
		status: {
			control: 'select',
			options: ['loading', 'online', 'busy', 'away', 'offline', 'disabled'],
			table: { defaultValue: { summary: 'loading' } },
		},
		size: {
			control: 'select',
			options: ['small'],
		},
	},
} satisfies Meta<typeof StatusBullet>;

type Story = StoryObj<typeof StatusBullet>;

export const Default: Story = {
	render: () => (
		<Box>
			<StatusBullet status='online' />
			<StatusBullet status='away' />
			<StatusBullet status='busy' />
			<StatusBullet status='disabled' />
			<StatusBullet status='offline' />
			<StatusBullet />
		</Box>
	),
};

export const Small: Story = {
	render: () => (
		<Box>
			<StatusBullet size='small' status='online' />
			<StatusBullet size='small' status='away' />
			<StatusBullet size='small' status='busy' />
			<StatusBullet size='small' status='disabled' />
			<StatusBullet size='small' status='offline' />
			<StatusBullet size='small' />
		</Box>
	),
};
