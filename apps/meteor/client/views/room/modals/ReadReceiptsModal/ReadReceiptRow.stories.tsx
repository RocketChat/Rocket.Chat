import { AvatarUrlContext } from '@rocket.chat/ui-contexts';
import type { StoryObj, Meta, Decorator } from '@storybook/react';

import ReadReceiptRow from './ReadReceiptRow';

const avatarUrl = `data:image/svg+xml,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" rx="8" fill="#1d74f5"/><text x="24" y="31" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#ffffff">JD</text></svg>`,
)}`;

const brokenAvatarUrl = 'data:image/png;base64,not-a-valid-image';

const withAvatarUrl =
	(url: string): Decorator =>
	(Story) => (
		<AvatarUrlContext.Provider value={{ getUserPathAvatar: () => url, getRoomPathAvatar: () => url }}>
			<Story />
		</AvatarUrlContext.Provider>
	);

export default {
	component: ReadReceiptRow,
	decorators: [withAvatarUrl(avatarUrl)],
	args: {
		_id: 'read-receipt-id',
		messageId: 'message-id',
		roomId: 'room-id',
		userId: 'user-id',
		ts: new Date('2024-01-01T10:00:00.000Z'),
		user: { _id: 'user-id', name: 'John Doe', username: 'john.doe' },
	},
} satisfies Meta<typeof ReadReceiptRow>;

export const Default: StoryObj<typeof ReadReceiptRow> = {
	name: 'ReadReceiptRow',
};

export const WithLongDisplayName: StoryObj<typeof ReadReceiptRow> = {
	args: {
		user: { _id: 'user-id', name: 'A Considerably Longer Display Name', username: 'long.name' },
	},
};

export const FailedImageLoad: StoryObj<typeof ReadReceiptRow> = {
	decorators: [withAvatarUrl(brokenAvatarUrl)],
};
