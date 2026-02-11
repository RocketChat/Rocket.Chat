import { archiveOldReadReceipts } from './readReceiptsArchive';

jest.mock('@rocket.chat/models', () => ({
	ReadReceipts: {
		findOlderThan: jest.fn(),
		deleteMany: jest.fn(),
	},
	ReadReceiptsArchive: {
		insertMany: jest.fn(),
	},
	Messages: {
		updateMany: jest.fn(),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		info: jest.fn(),
		error: jest.fn(),
	})),
}));

jest.mock('../../../app/settings/server', () => ({
	settings: {
		get: jest.fn(),
		watch: jest.fn(),
	},
}));

jest.mock('@rocket.chat/cron', () => ({
	cronJobs: {
		add: jest.fn(),
		has: jest.fn(),
		remove: jest.fn(),
	},
}));

import { ReadReceipts, ReadReceiptsArchive, Messages } from '@rocket.chat/models';
import { settings } from '../../../app/settings/server';

describe('Read Receipts Archive', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should use default retention days when setting is not available', async () => {
		(settings.get as jest.Mock).mockReturnValue(undefined);

		const toArrayMock = jest.fn().mockResolvedValue([]);
		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ toArray: toArrayMock });

		await archiveOldReadReceipts();

		expect(ReadReceipts.findOlderThan).toHaveBeenCalled();
		const cutoffDate = (ReadReceipts.findOlderThan as jest.Mock).mock.calls[0][0];
		const daysDiff = Math.floor((Date.now() - cutoffDate.getTime()) / (24 * 60 * 60 * 1000));
		expect(daysDiff).toBe(30); // Default 30 days
	});

	it('should use configured retention days', async () => {
		(settings.get as jest.Mock).mockReturnValue(45);

		const toArrayMock = jest.fn().mockResolvedValue([]);
		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ toArray: toArrayMock });

		await archiveOldReadReceipts();

		expect(ReadReceipts.findOlderThan).toHaveBeenCalled();
		const cutoffDate = (ReadReceipts.findOlderThan as jest.Mock).mock.calls[0][0];
		const daysDiff = Math.floor((Date.now() - cutoffDate.getTime()) / (24 * 60 * 60 * 1000));
		expect(daysDiff).toBe(45);
	});

	it('should not process when no old receipts found', async () => {
		(settings.get as jest.Mock).mockReturnValue(30);

		const toArrayMock = jest.fn().mockResolvedValue([]);
		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ toArray: toArrayMock });

		await archiveOldReadReceipts();

		expect(ReadReceiptsArchive.insertMany).not.toHaveBeenCalled();
		expect(Messages.updateMany).not.toHaveBeenCalled();
		expect(ReadReceipts.deleteMany).not.toHaveBeenCalled();
	});

	it('should archive old receipts and mark messages', async () => {
		(settings.get as jest.Mock).mockReturnValue(30);

		const oldReceipts = [
			{ _id: '1', messageId: 'msg1', userId: 'user1', ts: new Date('2020-01-01') },
			{ _id: '2', messageId: 'msg2', userId: 'user2', ts: new Date('2020-01-02') },
			{ _id: '3', messageId: 'msg1', userId: 'user3', ts: new Date('2020-01-03') },
		];

		const toArrayMock = jest.fn().mockResolvedValue(oldReceipts);
		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ toArray: toArrayMock });
		(ReadReceiptsArchive.insertMany as jest.Mock).mockResolvedValue({ insertedCount: 3 });
		(Messages.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 2 });
		(ReadReceipts.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 });

		await archiveOldReadReceipts();

		// Verify insertMany was called with receipts
		expect(ReadReceiptsArchive.insertMany).toHaveBeenCalledWith(oldReceipts, { ordered: false });

		// Verify messages were marked
		expect(Messages.updateMany).toHaveBeenCalledWith(
			{ _id: { $in: ['msg1', 'msg2'] } },
			{ $set: { receiptsArchived: true } }
		);

		// Verify old receipts were deleted
		expect(ReadReceipts.deleteMany).toHaveBeenCalledWith(expect.objectContaining({ ts: expect.any(Object) }));
	});

	it('should handle duplicate key errors gracefully', async () => {
		(settings.get as jest.Mock).mockReturnValue(30);

		const oldReceipts = [
			{ _id: '1', messageId: 'msg1', userId: 'user1', ts: new Date('2020-01-01') },
		];

		const toArrayMock = jest.fn().mockResolvedValue(oldReceipts);
		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ toArray: toArrayMock });

		// Simulate duplicate key error
		const duplicateError = Object.assign(new Error('Duplicate key'), {
			code: 11000,
			result: { insertedCount: 0 },
		});
		(ReadReceiptsArchive.insertMany as jest.Mock).mockRejectedValue(duplicateError);
		(Messages.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
		(ReadReceipts.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 1 });

		await archiveOldReadReceipts();

		// Should continue despite duplicate error
		expect(Messages.updateMany).toHaveBeenCalled();
		expect(ReadReceipts.deleteMany).toHaveBeenCalled();
	});

	it('should rethrow non-duplicate errors', async () => {
		(settings.get as jest.Mock).mockReturnValue(30);

		const oldReceipts = [
			{ _id: '1', messageId: 'msg1', userId: 'user1', ts: new Date('2020-01-01') },
		];

		const toArrayMock = jest.fn().mockResolvedValue(oldReceipts);
		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ toArray: toArrayMock });

		// Simulate other error
		const otherError = new Error('Connection failed');
		(ReadReceiptsArchive.insertMany as jest.Mock).mockRejectedValue(otherError);

		await expect(archiveOldReadReceipts()).rejects.toThrow('Connection failed');
	});
});

