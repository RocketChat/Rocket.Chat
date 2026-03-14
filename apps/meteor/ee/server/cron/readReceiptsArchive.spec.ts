import { ReadReceipts, ReadReceiptsArchive, Messages } from '@rocket.chat/models';

import { archiveOldReadReceipts } from './readReceiptsArchive';
import { settings } from '../../../app/settings/server';

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

// Mock setTimeout to avoid actual delays in tests
jest.useFakeTimers();

describe('Read Receipts Archive', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
	});

	it('should use default retention days and batch size when settings are not available', async () => {
		(settings.get as jest.Mock).mockReturnValue(undefined);

		const limitMock = jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });
		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ limit: limitMock });

		await archiveOldReadReceipts();

		expect(ReadReceipts.findOlderThan).toHaveBeenCalled();
		expect(limitMock).toHaveBeenCalledWith(10000); // Default batch size
		const cutoffDate = (ReadReceipts.findOlderThan as jest.Mock).mock.calls[0][0];
		const daysDiff = Math.floor((Date.now() - cutoffDate.getTime()) / (24 * 60 * 60 * 1000));
		expect(daysDiff).toBe(30); // Default 30 days
	});

	it('should use configured retention days and batch size', async () => {
		(settings.get as jest.Mock).mockImplementation((key: string) => {
			if (key === 'Message_Read_Receipt_Archive_Retention_Days') return 45;
			if (key === 'Message_Read_Receipt_Archive_Batch_Size') return 5000;
			return undefined;
		});

		const limitMock = jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });
		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ limit: limitMock });

		await archiveOldReadReceipts();

		expect(ReadReceipts.findOlderThan).toHaveBeenCalled();
		expect(limitMock).toHaveBeenCalledWith(5000); // Custom batch size
		const cutoffDate = (ReadReceipts.findOlderThan as jest.Mock).mock.calls[0][0];
		const daysDiff = Math.floor((Date.now() - cutoffDate.getTime()) / (24 * 60 * 60 * 1000));
		expect(daysDiff).toBe(45);
	});

	it('should not process when no old receipts found', async () => {
		(settings.get as jest.Mock).mockReturnValue(30);

		const limitMock = jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });
		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ limit: limitMock });

		await archiveOldReadReceipts();

		expect(ReadReceiptsArchive.insertMany).not.toHaveBeenCalled();
		expect(Messages.updateMany).not.toHaveBeenCalled();
		expect(ReadReceipts.deleteMany).not.toHaveBeenCalled();
	});

	it('should archive old receipts in single batch and mark messages', async () => {
		(settings.get as jest.Mock).mockReturnValue(30);

		const oldReceipts = [
			{ _id: '1', messageId: 'msg1', userId: 'user1', ts: new Date('2020-01-01') },
			{ _id: '2', messageId: 'msg2', userId: 'user2', ts: new Date('2020-01-02') },
			{ _id: '3', messageId: 'msg1', userId: 'user3', ts: new Date('2020-01-03') },
		];

		const limitMock = jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(oldReceipts) });
		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ limit: limitMock });
		(ReadReceiptsArchive.insertMany as jest.Mock).mockResolvedValue({ insertedCount: 3 });
		(Messages.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 2 });
		(ReadReceipts.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 });

		await archiveOldReadReceipts();

		// Verify insertMany was called with receipts
		expect(ReadReceiptsArchive.insertMany).toHaveBeenCalledWith(oldReceipts, { ordered: false });

		// Verify messages were marked
		expect(Messages.updateMany).toHaveBeenCalledWith({ _id: { $in: ['msg1', 'msg2'] } }, { $set: { receiptsArchived: true } });

		// Verify old receipts were deleted by ID
		expect(ReadReceipts.deleteMany).toHaveBeenCalledWith({ _id: { $in: ['1', '2', '3'] } });
	});

	it('should process multiple batches with delay', async () => {
		(settings.get as jest.Mock).mockImplementation((key: string) => {
			if (key === 'Message_Read_Receipt_Archive_Retention_Days') return 30;
			if (key === 'Message_Read_Receipt_Archive_Batch_Size') return 2;
			return undefined;
		});

		const batch1 = [
			{ _id: '1', messageId: 'msg1', userId: 'user1', ts: new Date('2020-01-01') },
			{ _id: '2', messageId: 'msg2', userId: 'user2', ts: new Date('2020-01-02') },
		];
		const batch2 = [{ _id: '3', messageId: 'msg3', userId: 'user3', ts: new Date('2020-01-03') }];

		let callCount = 0;
		const limitMock = jest.fn().mockImplementation(() => ({
			toArray: jest.fn().mockImplementation(() => {
				callCount++;
				if (callCount === 1) return Promise.resolve(batch1);
				if (callCount === 2) return Promise.resolve(batch2);
				return Promise.resolve([]);
			}),
		}));

		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ limit: limitMock });
		(ReadReceiptsArchive.insertMany as jest.Mock).mockResolvedValue({ insertedCount: 2 });
		(Messages.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 1 });
		(ReadReceipts.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 });

		const archivePromise = archiveOldReadReceipts();

		// Fast-forward timers for delays between batches
		await jest.runAllTimersAsync();
		await archivePromise;

		// Should process 2 batches
		expect(ReadReceiptsArchive.insertMany).toHaveBeenCalledTimes(2);
		expect(Messages.updateMany).toHaveBeenCalledTimes(2);
		expect(ReadReceipts.deleteMany).toHaveBeenCalledTimes(2);
	});

	it('should handle duplicate key errors gracefully', async () => {
		(settings.get as jest.Mock).mockReturnValue(30);

		const oldReceipts = [{ _id: '1', messageId: 'msg1', userId: 'user1', ts: new Date('2020-01-01') }];

		const limitMock = jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(oldReceipts) });
		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ limit: limitMock });

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

		const oldReceipts = [{ _id: '1', messageId: 'msg1', userId: 'user1', ts: new Date('2020-01-01') }];

		const limitMock = jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(oldReceipts) });
		(ReadReceipts.findOlderThan as jest.Mock).mockReturnValue({ limit: limitMock });

		// Simulate other error
		const otherError = new Error('Connection failed');
		(ReadReceiptsArchive.insertMany as jest.Mock).mockRejectedValue(otherError);

		await expect(archiveOldReadReceipts()).rejects.toThrow('Connection failed');
	});
});
