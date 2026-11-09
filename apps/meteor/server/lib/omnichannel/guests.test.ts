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
	Subscriptions: { removeByRoomIds: sinon.stub() },
	LivechatContacts: {},
	Users: {},
};

const fileUploadMock = { removeFilesByRoomId: sinon.stub() };
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

	beforeEach(() => {
		rooms = [];
		inquiries = [];

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
		modelsMock.Subscriptions.removeByRoomIds.reset();
		modelsMock.Subscriptions.removeByRoomIds.resolves();
		fileUploadMock.removeFilesByRoomId.reset();
		fileUploadMock.removeFilesByRoomId.resolves();
		notifyOnSubscriptionChangedMock.reset();
		notifyOnLivechatInquiryChangedMock.reset();
	});

	it('skips room cleanup when the visitor has no rooms', async () => {
		await removeGuest({ _id: 'visitor-id' });

		expect(modelsMock.Subscriptions.removeByRoomIds.notCalled).to.be.true;
		expect(modelsMock.Messages.removeByRoomIds.notCalled).to.be.true;
		expect(modelsMock.ReadReceipts.removeByRoomIds.notCalled).to.be.true;
		expect(modelsMock.ReadReceiptsArchive.removeByRoomIds.notCalled).to.be.true;
		expect(fileUploadMock.removeFilesByRoomId.notCalled).to.be.true;
		expect(modelsMock.LivechatRooms.removeByVisitorId.calledOnceWithExactly('visitor-id')).to.be.true;
		expect(modelsMock.LivechatVisitors.disableById.calledOnceWithExactly('visitor-id')).to.be.true;
	});

	it('removes all room data in batches and preserves cleanup notifications', async () => {
		rooms = [{ _id: 'room-one' }, { _id: 'room-two' }];
		inquiries = [{ _id: 'inquiry-one' }];

		await removeGuest({ _id: 'visitor-id' });

		const roomIds = ['room-one', 'room-two'];
		expect(modelsMock.Subscriptions.removeByRoomIds.calledOnce).to.be.true;
		expect(modelsMock.Subscriptions.removeByRoomIds.firstCall.args[0]).to.deep.equal(roomIds);
		expect(modelsMock.Messages.removeByRoomIds.calledOnceWithExactly(roomIds)).to.be.true;
		expect(modelsMock.ReadReceipts.removeByRoomIds.calledOnceWithExactly(roomIds)).to.be.true;
		expect(modelsMock.ReadReceiptsArchive.removeByRoomIds.calledOnceWithExactly(roomIds)).to.be.true;
		expect(fileUploadMock.removeFilesByRoomId.callCount).to.equal(2);
		expect(fileUploadMock.removeFilesByRoomId.getCalls().map(({ args }) => args[0])).to.deep.equal(roomIds);

		const { onTrash } = modelsMock.Subscriptions.removeByRoomIds.firstCall.args[1] as {
			onTrash: (doc: ISubscription) => void;
		};
		const subscription = { _id: 'subscription-id' } as ISubscription;
		onTrash(subscription);
		expect(notifyOnSubscriptionChangedMock.calledOnceWithExactly(subscription, 'removed')).to.be.true;

		expect(modelsMock.LivechatRooms.removeByVisitorId.calledOnceWithExactly('visitor-id')).to.be.true;
		expect(modelsMock.LivechatInquiry.findByVisitorIds.calledOnceWithExactly(['visitor-id'])).to.be.true;
		expect(modelsMock.LivechatInquiry.removeByIds.calledOnceWithExactly(['inquiry-one'])).to.be.true;
		expect(notifyOnLivechatInquiryChangedMock.calledOnceWithExactly(inquiries, 'removed')).to.be.true;
		expect(modelsMock.LivechatVisitors.disableById.calledOnceWithExactly('visitor-id')).to.be.true;
	});
});
