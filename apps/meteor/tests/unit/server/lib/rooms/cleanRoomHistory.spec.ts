import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Messages: {
		findFilesByRoomIdPinnedTimestampAndUsers: sinon.stub(),
		findByIdPinnedTimestampLimitAndUsers: sinon.stub(),
		removeByIdPinnedTimestampLimitAndUsers: sinon.stub(),
		findThreadsByRoomIdPinnedTimestampAndUsers: sinon.stub(),
		getLastVisibleUserMessageSentByRoomId: sinon.stub(),
	},
	Rooms: {
		resetLastMessageById: sinon.stub(),
		findOneDiscussionById: sinon.stub(),
	},
	Subscriptions: {
		findUnreadThreadsByRoomId: sinon.stub(),
		removeUnreadThreadsByRoomId: sinon.stub(),
	},
	ReadReceipts: { removeByMessageIds: sinon.stub() },
	ReadReceiptsArchive: { removeByMessageIds: sinon.stub() },
};

const broadcastMock = sinon.stub();
const notifyOnSubscriptionChangedByIdMock = sinon.stub();

const { cleanRoomHistory } = p.noCallThru().load('../../../../../server/lib/rooms/cleanRoomHistory.ts', {
	'@rocket.chat/core-services': { api: { broadcast: broadcastMock } },
	'@rocket.chat/models': modelsMock,
	'./deleteRoom': { deleteRoom: sinon.stub() },
	'../i18n': { i18n: { t: (key: string) => key } },
	'../logger/system': { SystemLogger: { error: sinon.stub() } },
	'../media/file-upload': { FileUpload: { getStore: sinon.stub() } },
	'../messaging/discussions/updateAndNotifyParentRoomWithParentMessage': { updateAndNotifyParentRoomWithParentMessage: sinon.stub() },
	'../notifyListener': {
		notifyOnRoomChangedById: sinon.stub(),
		notifyOnSubscriptionChangedById: notifyOnSubscriptionChangedByIdMock,
	},
});

const ids = (prefix: string, count: number) => Array.from({ length: count }, (_, i) => `${prefix}${i}`);
const cursorOf = (docs: unknown[]) => ({
	toArray: async () => docs,
	forEach: async (fn: (doc: any) => void) => docs.forEach(fn),
	async *[Symbol.asyncIterator]() {
		yield* docs;
	},
});

describe('cleanRoomHistory', () => {
	beforeEach(() => {
		[
			...Object.values(modelsMock.Messages),
			...Object.values(modelsMock.Subscriptions),
			modelsMock.Rooms.resetLastMessageById,
			modelsMock.ReadReceipts.removeByMessageIds,
			modelsMock.ReadReceiptsArchive.removeByMessageIds,
			broadcastMock,
			notifyOnSubscriptionChangedByIdMock,
		].forEach((stub) => stub.reset());

		modelsMock.Messages.findFilesByRoomIdPinnedTimestampAndUsers.returns(cursorOf([]));
		modelsMock.Messages.findByIdPinnedTimestampLimitAndUsers.resolves([]);
		modelsMock.Messages.removeByIdPinnedTimestampLimitAndUsers.callsFake(async (...args: unknown[]) => (args[7] as string[]).length);
	});

	it('deletes the whole backlog in bounded batches, together with their read receipts', async () => {
		const batches = [ids('a', 1000), ids('b', 1000), ids('c', 5)];
		batches.forEach((batch, i) => modelsMock.Messages.findByIdPinnedTimestampLimitAndUsers.onCall(i).resolves(batch));

		const count = await cleanRoomHistory({ rid: 'rid' });

		expect(count).to.equal(2005);
		expect(modelsMock.Messages.removeByIdPinnedTimestampLimitAndUsers.getCalls().map((call) => call.args[7])).to.deep.equal(batches);
		expect(modelsMock.ReadReceipts.removeByMessageIds.getCalls().map((call) => call.args[0])).to.deep.equal(batches);
		expect(modelsMock.ReadReceiptsArchive.removeByMessageIds.getCalls().map((call) => call.args[0])).to.deep.equal(batches);
		expect(broadcastMock.calledOnceWith('notify.deleteMessageBulk', 'rid', sinon.match({ ids: undefined }))).to.be.true;
	});

	it('never selects more messages than the requested limit', async () => {
		modelsMock.Messages.findByIdPinnedTimestampLimitAndUsers.callsFake(async (...args: unknown[]) =>
			ids(`l${args[4]}-`, args[4] as number),
		);

		const count = await cleanRoomHistory({ rid: 'rid', limit: 1500 });

		expect(count).to.equal(1500);
		expect(modelsMock.Messages.findByIdPinnedTimestampLimitAndUsers.getCalls().map((call) => call.args[4])).to.deep.equal([1000, 500]);
		expect(broadcastMock.firstCall.args[2].ids).to.have.lengthOf(1500);
	});

	it('still reflects the batches already deleted when a later batch fails', async () => {
		modelsMock.Messages.findByIdPinnedTimestampLimitAndUsers.onCall(0).resolves(ids('a', 1000));
		modelsMock.Messages.findByIdPinnedTimestampLimitAndUsers.onCall(1).resolves(ids('b', 1000));
		modelsMock.ReadReceipts.removeByMessageIds.onCall(1).rejects(new Error('database unavailable'));

		await expect(cleanRoomHistory({ rid: 'rid' })).to.be.rejectedWith('database unavailable');

		expect(modelsMock.Rooms.resetLastMessageById.calledOnceWith('rid', sinon.match.any, -2000)).to.be.true;
		expect(broadcastMock.calledOnceWith('notify.deleteMessageBulk', 'rid')).to.be.true;
	});

	it('clears pruned threads from unread lists in bounded batches', async () => {
		modelsMock.Messages.findThreadsByRoomIdPinnedTimestampAndUsers.returns(cursorOf(ids('t', 1500).map((_id) => ({ _id }))));
		modelsMock.Subscriptions.findUnreadThreadsByRoomId.returns(cursorOf([{ _id: 'sub1' }]));
		modelsMock.Subscriptions.removeUnreadThreadsByRoomId.resolves({ modifiedCount: 1 });

		await cleanRoomHistory({ rid: 'rid', ignoreThreads: false });

		expect(modelsMock.Subscriptions.removeUnreadThreadsByRoomId.getCalls().map((call) => call.args[1].length)).to.deep.equal([1000, 500]);
		expect(notifyOnSubscriptionChangedByIdMock.alwaysCalledWith('sub1')).to.be.true;
	});
});
