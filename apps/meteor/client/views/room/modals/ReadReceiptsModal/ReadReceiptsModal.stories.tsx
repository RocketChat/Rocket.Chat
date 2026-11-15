import type { IReadReceiptWithUser } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { StoryObj, Meta } from '@storybook/react';
import { action } from 'storybook/actions';

import ReadReceiptsModal from './ReadReceiptsModal';

const readReceipts: IReadReceiptWithUser[] = [
	{
		_id: 'read-receipt-1',
		messageId: 'message-id',
		roomId: 'room-id',
		userId: 'user-1',
		ts: new Date('2024-01-01T10:00:00.000Z'),
		_updatedAt: new Date('2024-01-01T10:00:00.000Z'),
		user: { _id: 'user-1', name: 'John Doe', username: 'john.doe' },
	},
	{
		_id: 'read-receipt-2',
		messageId: 'message-id',
		roomId: 'room-id',
		userId: 'user-2',
		ts: new Date('2024-01-01T10:05:23.000Z'),
		_updatedAt: new Date('2024-01-01T10:05:23.000Z'),
		user: { _id: 'user-2', name: 'Jane Smith', username: 'jane.smith' },
	},
	{
		_id: 'read-receipt-3',
		messageId: 'message-id',
		roomId: 'room-id',
		userId: 'user-3',
		ts: new Date('2024-01-01T11:30:45.000Z'),
		_updatedAt: new Date('2024-01-01T11:30:45.000Z'),
		user: { _id: 'user-3', name: 'Alice Johnson', username: 'alice.johnson' },
	},
];

export default {
	component: ReadReceiptsModal,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				Read_by: 'Read by',
				No_results_found: 'No results found',
			})
			.buildStoryDecorator(),
	],
	args: {
		onClose: action('onClose'),
	},
} satisfies Meta<typeof ReadReceiptsModal>;

export const Default: StoryObj<typeof ReadReceiptsModal> = {
	decorators: [
		mockAppRoot()
			.withMethod('getReadReceipts', () => readReceipts)
			.buildStoryDecorator(),
	],
};

export const Loading: StoryObj<typeof ReadReceiptsModal> = {
	decorators: [
		mockAppRoot()
			.withMethod('getReadReceipts', () => new Promise<IReadReceiptWithUser[]>(() => undefined) as unknown as IReadReceiptWithUser[])
			.buildStoryDecorator(),
	],
};

export const Empty: StoryObj<typeof ReadReceiptsModal> = {
	decorators: [
		mockAppRoot()
			.withMethod('getReadReceipts', () => [])
			.buildStoryDecorator(),
	],
};
