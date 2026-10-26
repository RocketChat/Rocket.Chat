import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Box } from '../Box';
import StatusBullet from './StatusBullet';

export default {
	title: 'Data Display/StatusBullet',
	component: StatusBullet,
	parameters: {
		docs: {
			description: {
				component:
					"A round icon that shows a user's status, using both color and a smaller icon.\n\n" +
					'**Rules**\n' +
					"- Use accompanied by the user's name in proper context, or when the user is setting their own status.\n" +
					'- Each status color is paired with a smaller icon for accessibility — color is never the only channel.',
			},
		},
	},
	argTypes: {
		status: {
			control: 'select',
			options: ['loading', 'online', 'busy', 'away', 'offline', 'disabled'],
			description: 'Status represented by the bullet icon.',
			table: { defaultValue: { summary: 'loading' } },
		},
		size: {
			control: 'select',
			options: ['small'],
			description: 'Size of the bullet icon.',
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
