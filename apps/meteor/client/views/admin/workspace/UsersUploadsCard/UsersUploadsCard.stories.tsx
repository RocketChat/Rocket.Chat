import type { IStats } from '@rocket.chat/core-typings';
import type { Meta, StoryObj } from '@storybook/react';

import UsersUploadsCard from './UsersUploadsCard';

export default {
	component: UsersUploadsCard,
	parameters: {
		layout: 'centered',
	},
	args: {
		statistics: {
			onlineUsers: 12,
			busyUsers: 3,
			awayUsers: 5,
			offlineUsers: 80,
			totalUsers: 100,
			totalConnectedUsers: 20,
			activeUsers: 90,
			activeGuests: 4,
			nonActiveUsers: 6,
			appUsers: 2,
			uploadsTotal: 321,
			uploadsTotalSize: 123456789,
		} as IStats,
	},
} satisfies Meta<typeof UsersUploadsCard>;

export const Default: StoryObj<typeof UsersUploadsCard> = {};
