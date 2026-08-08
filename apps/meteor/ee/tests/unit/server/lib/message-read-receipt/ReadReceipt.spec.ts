import type { IMessage, IReadReceiptWithUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatVisitors: { findByIds: sinon.stub() },
	Messages: {},
	ReadReceipts: { findByMessageId: sinon.stub() },
	ReadReceiptsArchive: { findByMessageId: sinon.stub() },
	Rooms: {},
	Subscriptions: {},
	Users: { findByIds: sinon.stub() },
};

const { ReadReceipt } = proxyquire.noCallThru().load('../../../../../server/lib/message-read-receipt/ReadReceipt', {
	'@rocket.chat/core-services': { api: { broadcast: sinon.stub() } },
	'@rocket.chat/models': modelsMock,
	'../../../../server/lib/logger/system': { SystemLogger: { error: sinon.stub() } },
	'../../../../server/lib/notifyListener': { notifyOnMessageChange: sinon.stub(), notifyOnRoomChangedById: sinon.stub() },
	'../../../../server/settings': { settings: { get: sinon.stub() } },
});

type GetReceipts = (
	message: Pick<IMessage, '_id' | 'receiptsArchived'>,
	options?: { offset?: number; count?: number },
) => Promise<IReadReceiptWithUser[]>;

describe('ReadReceipt.getReceipts', () => {
	beforeEach(() => {
		modelsMock.ReadReceipts.findByMessageId.reset();
		modelsMock.ReadReceiptsArchive.findByMessageId.reset();
		modelsMock.LivechatVisitors.findByIds.reset();
		modelsMock.Users.findByIds.reset();

		modelsMock.ReadReceipts.findByMessageId.returns({
			toArray: sinon.stub().resolves([
				{ _id: 'receipt-3', messageId: 'message-id', roomId: 'room-id', userId: 'user-3', ts: new Date('2026-01-03') },
				{ _id: 'receipt-1', messageId: 'message-id', roomId: 'room-id', userId: 'user-1', ts: new Date('2026-01-01') },
				{ _id: 'receipt-2', messageId: 'message-id', roomId: 'room-id', userId: 'user-2', ts: new Date('2026-01-02') },
			]),
		});
		modelsMock.Users.findByIds.returns({
			toArray: sinon.stub().resolves([
				{ _id: 'user-1', username: 'user-1' },
				{ _id: 'user-2', username: 'user-2' },
				{ _id: 'user-3', username: 'user-3' },
			]),
		});
	});

	it('applies offset and count before resolving receipt users', async () => {
		const getReceipts = ReadReceipt.getReceipts as GetReceipts;

		const receipts = await getReceipts.call(ReadReceipt, { _id: 'message-id' }, { offset: 1, count: 1 });

		expect(receipts.map(({ _id }) => _id)).to.deep.equal(['receipt-2']);
		expect(modelsMock.Users.findByIds.calledOnceWithExactly(['user-2'], { projection: { username: 1, name: 1 } })).to.equal(true);
	});

	it('treats count zero as unlimited after applying the offset', async () => {
		const getReceipts = ReadReceipt.getReceipts as GetReceipts;

		const receipts = await getReceipts.call(ReadReceipt, { _id: 'message-id' }, { offset: 1, count: 0 });

		expect(receipts.map(({ _id }) => _id)).to.deep.equal(['receipt-2', 'receipt-3']);
	});
});
