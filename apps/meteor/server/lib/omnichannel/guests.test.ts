import { beforeEach, describe, it } from 'node:test';

import type { ISubscription } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatVisitors: { disableById: sinon.stub() },
	LivechatCustomField: {},
	LivechatInquiry: { findByVisitorIds: sinon.stub(), removeByIds: sinon.stub() },
	LivechatRooms: { findByVisitorId: sinon.stub(), removeByVisitorId: sinon.stub() },
	Messages: { removeByRoomIds: sinon.stub() },
	ReadReceipts: { removeByRoomIds: sinon.stub() },
	ReadReceiptsArchive: { removeByRoomIds: sinon.stub() },
	Subscriptions: { removeByRoomId: sinon.stub() },
	LivechatContacts: {},
	Uploads: { findByRoomIds: sinon.stub() },
	Users: {},
};

const deleteUploadMock = sinon.stub();
const fileUploadMock = { removeFilesByRoomId: sinon.stub(), getStore: sinon.stub().returns({ deleteById: deleteUploadMock }) };
const notifyOnSubscriptionChangedMock = sinon.stub();
const notifyOnLivechatInquiryChangedMock = sinon.stub();

const { removeGuest } = proxyquire.noCallThru().load('./guests.ts', {
	'@rocket.chat/apps': { Apps: {}, AppEvents: {} },
	'@rocket.chat/models': modelsMock,
	'ua-parser-js': {},
	'./Helper': { parseAgentCustomFields: sinon.stub() },
	'./logger': { livechatLogger: { debug: sinon.stub() } },
	'../../../lib/utils/stringUtils': { trim: sinon.stub() },
	'../authorization/hasPermission': { hasPermissionAsync: sinon.stub() },
	'../i18n': { i18n: { t: sinon.stub() } },
	'../media/file-upload': { FileUpload: fileUploadMock },
	'../notifyListener': {
		notifyOnSubscriptionChanged: notifyOnSubscriptionChangedMock,
		notifyOnLivechatInquiryChanged: notifyOnLivechatInquiryChangedMock,
		notifyOnLivechatInquiryChangedByToken: sinon.stub(),
	},
});

describe('removeGuest', () => {
	let rooms: { _id: string }[];
	let inquiries: { _id: string }[];
	let subscriptions: { _id: string; rid: string }[];
	let remainingUploads: { _id: string }[];

	beforeEach(() => {
		rooms = [];
		inquiries = [];
		subscriptions = [];
		remainingUploads = [];

		modelsMock.LivechatVisitors.disableById.reset();
		modelsMock.LivechatVisitors.disableById.resolves({ _id: 'visitor-id' });
		modelsMock.LivechatInquiry.findByVisitorIds.reset();
		modelsMock.LivechatInquiry.findByVisitorIds.callsFake(() => ({ toArray: async () => inquiries }));
		modelsMock.LivechatInquiry.removeByIds.reset();
		modelsMock.LivechatInquiry.removeByIds.resolves();
		modelsMock.LivechatRooms.findByVisitorId.reset();
		modelsMock.LivechatRooms.findByVisitorId.callsFake(() => ({ toArray: async () => rooms }));
		modelsMock.LivechatRooms.removeByVisitorId.reset();
		modelsMock.LivechatRooms.removeByVisitorId.resolves();
		modelsMock.Messages.removeByRoomIds.reset();
		modelsMock.Messages.removeByRoomIds.resolves();
		modelsMock.ReadReceipts.removeByRoomIds.reset();
		modelsMock.ReadReceipts.removeByRoomIds.resolves();
		modelsMock.ReadReceiptsArchive.removeByRoomIds.reset();
		modelsMock.ReadReceiptsArchive.removeByRoomIds.resolves();
		modelsMock.Subscriptions.removeByRoomId.reset();
		modelsMock.Subscriptions.removeByRoomId.callsFake(async (roomId, options) => {
			const roomSubscriptions = subscriptions.filter(({ rid }) => rid === roomId);
			for (const subscription of roomSubscriptions) {
				options.onTrash(subscription as unknown as ISubscription);
			}
			return { acknowledged: true, deletedCount: roomSubscriptions.length };
		});
		fileUploadMock.removeFilesByRoomId.reset();
		fileUploadMock.removeFilesByRoomId.resolves();
		modelsMock.Uploads.findByRoomIds.reset();
		modelsMock.Uploads.findByRoomIds.callsFake(async function* () {
			yield* remainingUploads;
		});
		deleteUploadMock.reset();
		deleteUploadMock.resolves();
		notifyOnSubscriptionChangedMock.reset();
		notifyOnLivechatInquiryChangedMock.reset();
	});

	it('skips room cleanup when the visitor has no rooms', async () => {
		await removeGuest({ _id: 'visitor-id' });

		expect(modelsMock.Subscriptions.removeByRoomId.notCalled).to.be.true;
		expect(modelsMock.Messages.removeByRoomIds.notCalled).to.be.true;
		expect(modelsMock.ReadReceipts.removeByRoomIds.notCalled).to.be.true;
		expect(modelsMock.ReadReceiptsArchive.removeByRoomIds.notCalled).to.be.true;
		expect(fileUploadMock.removeFilesByRoomId.notCalled).to.be.true;
		expect(modelsMock.Uploads.findByRoomIds.notCalled).to.be.true;
		expect(modelsMock.LivechatRooms.removeByVisitorId.calledOnceWithExactly('visitor-id')).to.be.true;
		expect(modelsMock.LivechatVisitors.disableById.calledOnceWithExactly('visitor-id')).to.be.true;
	});

	it('cleans a single room before disabling the visitor', async () => {
		rooms = [{ _id: 'room-one' }];
		inquiries = [{ _id: 'inquiry-one' }];
		subscriptions = [{ _id: 'subscription-one', rid: 'room-one' }];

		await removeGuest({ _id: 'visitor-id' });

		expect(fileUploadMock.removeFilesByRoomId.calledOnceWithExactly('room-one')).to.be.true;
		expect(modelsMock.Subscriptions.removeByRoomId.calledOnceWithExactly('room-one', sinon.match.object)).to.be.true;
		expect(modelsMock.Subscriptions.removeByRoomId.calledAfter(fileUploadMock.removeFilesByRoomId)).to.be.true;
		expect(modelsMock.Messages.removeByRoomIds.calledOnceWithExactly(['room-one'])).to.be.true;
		expect(modelsMock.ReadReceipts.removeByRoomIds.calledOnceWithExactly(['room-one'])).to.be.true;
		expect(modelsMock.ReadReceiptsArchive.removeByRoomIds.calledOnceWithExactly(['room-one'])).to.be.true;
		expect(modelsMock.Uploads.findByRoomIds.calledOnceWithExactly(['room-one'], { projection: { _id: 1 } })).to.be.true;
		expect(deleteUploadMock.notCalled).to.be.true;
		expect(modelsMock.LivechatInquiry.removeByIds.calledOnceWithExactly(['inquiry-one'])).to.be.true;
		expect(notifyOnLivechatInquiryChangedMock.calledOnceWithExactly(inquiries, 'removed')).to.be.true;
		expect(modelsMock.LivechatVisitors.disableById.calledOnceWithExactly('visitor-id')).to.be.true;
	});

	it('batches multiple rooms and emits subscription notifications during cleanup', async () => {
		rooms = [{ _id: 'room-one' }, { _id: 'room-two' }];
		inquiries = [{ _id: 'inquiry-one' }];
		subscriptions = [
			{ _id: 'subscription-one', rid: 'room-one' },
			{ _id: 'subscription-two', rid: 'room-two' },
		];

		await removeGuest({ _id: 'visitor-id' });

		const roomIds = ['room-one', 'room-two'];
		expect(modelsMock.Subscriptions.removeByRoomId.getCalls().map(({ args }) => args[0])).to.deep.equal(roomIds);
		expect(modelsMock.Messages.removeByRoomIds.calledOnceWithExactly(roomIds)).to.be.true;
		expect(modelsMock.ReadReceipts.removeByRoomIds.calledOnceWithExactly(roomIds)).to.be.true;
		expect(modelsMock.ReadReceiptsArchive.removeByRoomIds.calledOnceWithExactly(roomIds)).to.be.true;
		expect(fileUploadMock.removeFilesByRoomId.callCount).to.equal(2);
		expect(fileUploadMock.removeFilesByRoomId.getCalls().map(({ args }) => args[0])).to.deep.equal(roomIds);
		expect(notifyOnSubscriptionChangedMock.callCount).to.equal(2);
		for (const subscription of subscriptions) {
			expect(notifyOnSubscriptionChangedMock.calledWithExactly(subscription, 'removed')).to.be.true;
		}
		expect(modelsMock.LivechatRooms.removeByVisitorId.calledOnceWithExactly('visitor-id')).to.be.true;
		expect(modelsMock.LivechatInquiry.findByVisitorIds.calledOnceWithExactly(['visitor-id'])).to.be.true;
		expect(modelsMock.LivechatInquiry.removeByIds.calledOnceWithExactly(['inquiry-one'])).to.be.true;
		expect(notifyOnLivechatInquiryChangedMock.calledOnceWithExactly(inquiries, 'removed')).to.be.true;
		expect(modelsMock.LivechatVisitors.disableById.calledOnceWithExactly('visitor-id')).to.be.true;
	});

	it('waits for file cleanup to finish before deleting messages', async () => {
		rooms = [{ _id: 'room-one' }];
		let markFileCleanupStarted!: () => void;
		let releaseFileCleanup!: () => void;
		const fileCleanupStarted = new Promise<void>((resolve) => {
			markFileCleanupStarted = resolve;
		});
		const fileCleanupGate = new Promise<void>((resolve) => {
			releaseFileCleanup = resolve;
		});
		fileUploadMock.removeFilesByRoomId.callsFake(async () => {
			markFileCleanupStarted();
			await fileCleanupGate;
		});

		const cleanup = removeGuest({ _id: 'visitor-id' });
		await fileCleanupStarted;

		expect(modelsMock.Messages.removeByRoomIds.notCalled).to.be.true;
		releaseFileCleanup();
		await cleanup;

		expect(modelsMock.Messages.removeByRoomIds.calledOnceWithExactly(['room-one'])).to.be.true;
		expect(fileUploadMock.removeFilesByRoomId.calledOnceWithExactly('room-one')).to.be.true;
	});

	it('removes uploads that finished during cleanup once the rooms are gone', async () => {
		rooms = [{ _id: 'room-one' }, { _id: 'room-two' }];
		remainingUploads = [{ _id: 'late-upload-one' }, { _id: 'late-upload-two' }];

		await removeGuest({ _id: 'visitor-id' });

		expect(modelsMock.Uploads.findByRoomIds.calledOnceWithExactly(['room-one', 'room-two'], { projection: { _id: 1 } })).to.be.true;
		expect(modelsMock.Uploads.findByRoomIds.calledAfter(modelsMock.LivechatRooms.removeByVisitorId)).to.be.true;
		expect(deleteUploadMock.getCalls().map(({ args }) => args[0])).to.deep.equal(['late-upload-one', 'late-upload-two']);
		expect(modelsMock.LivechatVisitors.disableById.calledAfter(deleteUploadMock)).to.be.true;
	});

	it('reports a failed final upload sweep and leaves the visitor enabled', async () => {
		rooms = [{ _id: 'room-one' }];
		remainingUploads = [{ _id: 'late-upload' }];
		const sweepError = new Error('upload store unavailable');
		deleteUploadMock.rejects(sweepError);

		await expect(removeGuest({ _id: 'visitor-id' })).to.be.rejectedWith(sweepError.message);

		expect(deleteUploadMock.calledOnceWithExactly('late-upload')).to.be.true;
		expect(modelsMock.LivechatInquiry.findByVisitorIds.notCalled).to.be.true;
		expect(modelsMock.LivechatVisitors.disableById.notCalled).to.be.true;
	});

	it('completes the cleanup on retry after an earlier failure', async () => {
		rooms = [{ _id: 'room-one' }];
		modelsMock.Messages.removeByRoomIds.onFirstCall().rejects(new Error('message cleanup failed'));

		await expect(removeGuest({ _id: 'visitor-id' })).to.be.rejectedWith('message cleanup failed');
		expect(modelsMock.LivechatRooms.removeByVisitorId.notCalled).to.be.true;
		expect(modelsMock.LivechatVisitors.disableById.notCalled).to.be.true;

		await removeGuest({ _id: 'visitor-id' });

		expect(modelsMock.Messages.removeByRoomIds.callCount).to.equal(2);
		expect(modelsMock.LivechatRooms.removeByVisitorId.calledOnceWithExactly('visitor-id')).to.be.true;
		expect(modelsMock.LivechatVisitors.disableById.calledOnceWithExactly('visitor-id')).to.be.true;
	});

	it('limits concurrent file cleanup and attempts all rooms', async () => {
		rooms = Array.from({ length: 12 }, (_, index) => ({ _id: `room-${index}` }));
		let activeFileCleanups = 0;
		let maxActiveFileCleanups = 0;
		fileUploadMock.removeFilesByRoomId.callsFake(async () => {
			activeFileCleanups++;
			maxActiveFileCleanups = Math.max(maxActiveFileCleanups, activeFileCleanups);
			await new Promise((resolve) => setTimeout(resolve, 1));
			activeFileCleanups--;
		});

		await removeGuest({ _id: 'visitor-id' });

		expect(fileUploadMock.removeFilesByRoomId.callCount).to.equal(12);
		expect(maxActiveFileCleanups).to.be.greaterThan(1);
		expect(maxActiveFileCleanups).to.be.at.most(5);
	});

	it('isolates file cleanup failures to the affected room and leaves the visitor enabled', async () => {
		rooms = [{ _id: 'room-one' }, { _id: 'room-two' }, { _id: 'room-three' }];
		subscriptions = [
			{ _id: 'subscription-one', rid: 'room-one' },
			{ _id: 'subscription-three', rid: 'room-three' },
		];
		const fileError = new Error('file store unavailable');
		fileUploadMock.removeFilesByRoomId.callsFake(async (roomId) => {
			if (roomId === 'room-two') {
				throw fileError;
			}
		});

		await expect(removeGuest({ _id: 'visitor-id' })).to.be.rejectedWith(fileError.message);

		expect(fileUploadMock.removeFilesByRoomId.callCount).to.equal(3);
		expect(modelsMock.Subscriptions.removeByRoomId.getCalls().map(({ args }) => args[0])).to.deep.equal(['room-one', 'room-three']);
		expect(modelsMock.Messages.removeByRoomIds.calledOnceWithExactly(['room-one', 'room-three'])).to.be.true;
		expect(modelsMock.ReadReceipts.removeByRoomIds.calledOnceWithExactly(['room-one', 'room-three'])).to.be.true;
		expect(modelsMock.ReadReceiptsArchive.removeByRoomIds.calledOnceWithExactly(['room-one', 'room-three'])).to.be.true;
		expect(modelsMock.LivechatRooms.removeByVisitorId.notCalled).to.be.true;
		expect(modelsMock.LivechatInquiry.findByVisitorIds.notCalled).to.be.true;
		expect(modelsMock.LivechatVisitors.disableById.notCalled).to.be.true;
	});

	it('does not continue to later cleanup stages or disable the visitor when subscription cleanup fails', async () => {
		rooms = [{ _id: 'room-one' }];
		const subscriptionError = new Error('subscription cleanup failed');
		modelsMock.Subscriptions.removeByRoomId.rejects(subscriptionError);

		await expect(removeGuest({ _id: 'visitor-id' })).to.be.rejectedWith(subscriptionError.message);

		expect(fileUploadMock.removeFilesByRoomId.calledOnce).to.be.true;
		expect(modelsMock.Messages.removeByRoomIds.notCalled).to.be.true;
		expect(modelsMock.ReadReceipts.removeByRoomIds.notCalled).to.be.true;
		expect(modelsMock.ReadReceiptsArchive.removeByRoomIds.notCalled).to.be.true;
		expect(modelsMock.LivechatRooms.removeByVisitorId.notCalled).to.be.true;
		expect(modelsMock.LivechatInquiry.findByVisitorIds.notCalled).to.be.true;
		expect(modelsMock.LivechatVisitors.disableById.notCalled).to.be.true;
	});

	it('waits for every batched history deletion to settle and leaves the visitor enabled on failure', async () => {
		rooms = [{ _id: 'room-one' }];
		const messageError = new Error('message cleanup failed');
		let markReceiptDeletionStarted!: () => void;
		let releaseReceiptDeletion!: () => void;
		const receiptDeletionStarted = new Promise<void>((resolve) => {
			markReceiptDeletionStarted = resolve;
		});
		const receiptDeletionGate = new Promise<void>((resolve) => {
			releaseReceiptDeletion = resolve;
		});
		modelsMock.Messages.removeByRoomIds.rejects(messageError);
		modelsMock.ReadReceipts.removeByRoomIds.callsFake(async () => {
			markReceiptDeletionStarted();
			await receiptDeletionGate;
		});

		let cleanupSettled = false;
		const cleanup = removeGuest({ _id: 'visitor-id' }).then(
			() => {
				cleanupSettled = true;
				return { status: 'fulfilled' as const };
			},
			(error: unknown) => {
				cleanupSettled = true;
				return { status: 'rejected' as const, error };
			},
		);

		try {
			await receiptDeletionStarted;
			await new Promise<void>((resolve) => setImmediate(resolve));
			expect(cleanupSettled).to.be.false;
			expect(modelsMock.Messages.removeByRoomIds.calledOnce).to.be.true;
			expect(modelsMock.ReadReceiptsArchive.removeByRoomIds.calledOnce).to.be.true;
			expect(modelsMock.LivechatRooms.removeByVisitorId.notCalled).to.be.true;
			expect(modelsMock.LivechatVisitors.disableById.notCalled).to.be.true;
		} finally {
			releaseReceiptDeletion();
		}

		const result = await cleanup;
		expect(result.status).to.equal('rejected');
		if (result.status === 'rejected') {
			expect(result.error).to.equal(messageError);
		}

		expect(modelsMock.ReadReceipts.removeByRoomIds.calledOnce).to.be.true;
		expect(modelsMock.ReadReceiptsArchive.removeByRoomIds.calledOnce).to.be.true;
		expect(modelsMock.LivechatRooms.removeByVisitorId.notCalled).to.be.true;
		expect(modelsMock.LivechatInquiry.findByVisitorIds.notCalled).to.be.true;
		expect(modelsMock.LivechatVisitors.disableById.notCalled).to.be.true;
	});
});
