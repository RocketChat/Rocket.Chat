import type { IMessagesModel, IReadReceiptsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { archiveOldReadReceipts } from './readReceiptsArchive';
import { settings } from '../../../server/settings';

const readReceiptsModel = {
	findOlderThan: jest.fn(),
	removeByIds: jest.fn(),
};
const readReceiptsArchiveModel = {
	insertMany: jest.fn(),
};
const messagesModel = {
	setReceiptsArchivedById: jest.fn(),
};

registerModel('IReadReceiptsModel', readReceiptsModel as unknown as IReadReceiptsModel);
registerModel('IReadReceiptsArchiveModel', readReceiptsArchiveModel as unknown as IReadReceiptsModel);
registerModel('IMessagesModel', messagesModel as unknown as IMessagesModel);

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({
		info: jest.fn(),
		error: jest.fn(),
	})),
}));

jest.mock('../../../server/settings', () => ({
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
		readReceiptsModel.findOlderThan.mockReturnValue({ limit: limitMock });

		await archiveOldReadReceipts();

		expect(readReceiptsModel.findOlderThan).toHaveBeenCalled();
		expect(limitMock).toHaveBeenCalledWith(10000); // Default batch size
		const cutoffDate = readReceiptsModel.findOlderThan.mock.calls[0][0];
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
		readReceiptsModel.findOlderThan.mockReturnValue({ limit: limitMock });

		await archiveOldReadReceipts();

		expect(readReceiptsModel.findOlderThan).toHaveBeenCalled();
		expect(limitMock).toHaveBeenCalledWith(5000); // Custom batch size
		const cutoffDate = readReceiptsModel.findOlderThan.mock.calls[0][0];
		const daysDiff = Math.floor((Date.now() - cutoffDate.getTime()) / (24 * 60 * 60 * 1000));
		expect(daysDiff).toBe(45);
	});

	it('should not process when no old receipts found', async () => {
		(settings.get as jest.Mock).mockReturnValue(30);

		const limitMock = jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });
		readReceiptsModel.findOlderThan.mockReturnValue({ limit: limitMock });

		await archiveOldReadReceipts();

		expect(readReceiptsArchiveModel.insertMany).not.toHaveBeenCalled();
		expect(messagesModel.setReceiptsArchivedById).not.toHaveBeenCalled();
		expect(readReceiptsModel.removeByIds).not.toHaveBeenCalled();
	});

	it('should archive old receipts in single batch and mark messages', async () => {
		(settings.get as jest.Mock).mockReturnValue(30);

		const oldReceipts = [
			{ _id: '1', messageId: 'msg1', userId: 'user1', ts: new Date('2020-01-01') },
			{ _id: '2', messageId: 'msg2', userId: 'user2', ts: new Date('2020-01-02') },
			{ _id: '3', messageId: 'msg1', userId: 'user3', ts: new Date('2020-01-03') },
		];

		const limitMock = jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(oldReceipts) });
		readReceiptsModel.findOlderThan.mockReturnValue({ limit: limitMock });
		readReceiptsArchiveModel.insertMany.mockResolvedValue({ insertedCount: 3 });
		messagesModel.setReceiptsArchivedById.mockResolvedValue({ modifiedCount: 2 });
		readReceiptsModel.removeByIds.mockResolvedValue({ deletedCount: 3 });

		await archiveOldReadReceipts();

		// Verify insertMany was called with receipts
		expect(readReceiptsArchiveModel.insertMany).toHaveBeenCalledWith(oldReceipts, { ordered: false });

		// Verify messages were marked
		expect(messagesModel.setReceiptsArchivedById).toHaveBeenCalledWith(['msg1', 'msg2'], true);

		// Verify old receipts were deleted by ID
		expect(readReceiptsModel.removeByIds).toHaveBeenCalledWith(['1', '2', '3']);
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

		readReceiptsModel.findOlderThan.mockReturnValue({ limit: limitMock });
		readReceiptsArchiveModel.insertMany.mockResolvedValue({ insertedCount: 2 });
		messagesModel.setReceiptsArchivedById.mockResolvedValue({ modifiedCount: 1 });
		readReceiptsModel.removeByIds.mockResolvedValue({ deletedCount: 2 });

		const archivePromise = archiveOldReadReceipts();

		// Fast-forward timers for delays between batches
		await jest.runAllTimersAsync();
		await archivePromise;

		// Should process 2 batches
		expect(readReceiptsArchiveModel.insertMany).toHaveBeenCalledTimes(2);
		expect(messagesModel.setReceiptsArchivedById).toHaveBeenCalledTimes(2);
		expect(readReceiptsModel.removeByIds).toHaveBeenCalledTimes(2);
	});

	it('should handle duplicate key errors gracefully', async () => {
		(settings.get as jest.Mock).mockReturnValue(30);

		const oldReceipts = [{ _id: '1', messageId: 'msg1', userId: 'user1', ts: new Date('2020-01-01') }];

		const limitMock = jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(oldReceipts) });
		readReceiptsModel.findOlderThan.mockReturnValue({ limit: limitMock });

		// Simulate duplicate key error
		const duplicateError = Object.assign(new Error('Duplicate key'), {
			code: 11000,
			result: { insertedCount: 0 },
		});
		readReceiptsArchiveModel.insertMany.mockRejectedValue(duplicateError);
		messagesModel.setReceiptsArchivedById.mockResolvedValue({ modifiedCount: 1 });
		readReceiptsModel.removeByIds.mockResolvedValue({ deletedCount: 1 });

		await archiveOldReadReceipts();

		// Should continue despite duplicate error
		expect(messagesModel.setReceiptsArchivedById).toHaveBeenCalled();
		expect(readReceiptsModel.removeByIds).toHaveBeenCalled();
	});

	it('should rethrow non-duplicate errors', async () => {
		(settings.get as jest.Mock).mockReturnValue(30);

		const oldReceipts = [{ _id: '1', messageId: 'msg1', userId: 'user1', ts: new Date('2020-01-01') }];

		const limitMock = jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue(oldReceipts) });
		readReceiptsModel.findOlderThan.mockReturnValue({ limit: limitMock });

		// Simulate other error
		const otherError = new Error('Connection failed');
		readReceiptsArchiveModel.insertMany.mockRejectedValue(otherError);

		await expect(archiveOldReadReceipts()).rejects.toThrow('Connection failed');
	});
});
