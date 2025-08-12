import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import Sinon from 'sinon';

import { createFakeMessage, createFakeUser } from '../../../../mocks/data';

const models = {
	LivechatContacts: { isContactActiveOnPeriod: Sinon.stub(), markContactActiveForPeriod: Sinon.stub() },
	LivechatInquiry: { markInquiryActiveForPeriod: Sinon.stub() },
	LivechatRooms: {
		getVisitorActiveForPeriodUpdateQuery: Sinon.stub(),
		getAgentLastMessageTsUpdateQuery: Sinon.stub(),
		getResponseByRoomIdUpdateQuery: Sinon.stub(),
	},
};

const settingsGetMock = {
	get: Sinon.stub(),
};

const isMessageFromBotMock = { isMessageFromBot: Sinon.stub() };

const { markRoomResponded } = proxyquire.noCallThru().load('../../../../../app/livechat/server/hooks/markRoomResponded.ts', {
	'../../../../lib/callbacks': { callbacks: { add: Sinon.stub(), priority: { HIGH: 'high' } } },
	'../../../lib/server/lib/notifyListener': { notifyOnLivechatInquiryChanged: Sinon.stub() },
	'@rocket.chat/models': models,
	'../../../settings/server': { settings: settingsGetMock },
	'../lib/isMessageFromBot': isMessageFromBotMock,
});

describe('markRoomResponded', () => {
	beforeEach(() => {
		models.LivechatContacts.isContactActiveOnPeriod.reset();
		models.LivechatContacts.markContactActiveForPeriod.reset();
		models.LivechatInquiry.markInquiryActiveForPeriod.reset();
		models.LivechatRooms.getVisitorActiveForPeriodUpdateQuery.reset();
		models.LivechatRooms.getAgentLastMessageTsUpdateQuery.reset();
		models.LivechatRooms.getResponseByRoomIdUpdateQuery.reset();

		settingsGetMock.get.reset();
	});

	it('should return void if message is system message', async () => {
		const message = {
			t: 'livechat-started',
		};

		const room = {};

		const res = await markRoomResponded(message, room, {});

		expect(res).to.be.undefined;
	});

	it('should return void if message is edited message', async () => {
		const message = {
			editedAt: new Date(),
			editedBy: { _id: '123' },
		};

		const room = {};

		const res = await markRoomResponded(message, room, {});

		expect(res).to.be.undefined;
	});

	it('should return void if message is from visitor', async () => {
		const message = {
			token: 'token',
		};

		const room = {};

		const res = await markRoomResponded(message, room, {});

		expect(res).to.be.undefined;
	});

	it('should return void if message is from bot and setting is enabled', async () => {
		settingsGetMock.get.withArgs('Omnichannel_Metrics_Ignore_Automatic_Messages').resolves(true);

		const user = createFakeUser({ roles: ['bot'] });

		isMessageFromBotMock.isMessageFromBot.resolves(user);

		const message = createFakeMessage();
		const room = {};

		const res = await markRoomResponded(message, room, user);

		expect(res).to.be.undefined;
	});

	it('should try to mark visitor as active for current period', async () => {
		const message = {};
		const room = { v: { _id: '1234' } };

		await markRoomResponded(message, room, {});

		expect(models.LivechatContacts.markContactActiveForPeriod.calledOnce).to.be.true;
	});

	it('should try to mark inquiry as active for current period when room.v.activity doesnt include current period', async () => {
		const message = {};
		const room = { v: { activity: [] } };

		models.LivechatInquiry.markInquiryActiveForPeriod.resolves({});

		await markRoomResponded(message, room, {});

		expect(models.LivechatInquiry.markInquiryActiveForPeriod.calledOnce).to.be.true;
	});

	it('should return room.responseBy when room is not waiting for response', async () => {
		const message = {};
		const room = { v: { _id: '1234' }, waitingResponse: false, responseBy: { _id: '1234' } };

		const res = await markRoomResponded(message, room, {});

		expect(res).to.be.equal(room.responseBy);
		expect(models.LivechatRooms.getAgentLastMessageTsUpdateQuery.calledOnce).to.be.true;
	});

	it('should try to update the lastMessageTs property when a room was already answered by an agent', async () => {
		const message = { u: { _id: '1234', username: 'username' }, ts: new Date() };
		const room = { responseBy: { _id: '1234' }, v: { _id: '1234' } };

		const res = await markRoomResponded(message, room, {});

		expect(res).to.be.deep.equal(room.responseBy);
		expect(models.LivechatRooms.getAgentLastMessageTsUpdateQuery.calledOnce).to.be.true;
	});

	it('should add a new responseBy object when room is waiting for response', async () => {
		const message = { u: { _id: '1234', username: 'username' }, ts: new Date() };
		const room = { waitingResponse: true, v: { _id: '1234' } };

		const res = await markRoomResponded(message, room, {});

		expect(res).to.be.deep.equal({ _id: '1234', username: 'username', firstResponseTs: message.ts, lastMessageTs: message.ts });
		expect(models.LivechatRooms.getResponseByRoomIdUpdateQuery.calledOnce).to.be.true;
		expect(models.LivechatRooms.getResponseByRoomIdUpdateQuery.getCall(0).args[0]).to.be.deep.equal({
			_id: '1234',
			lastMessageTs: message.ts,
			firstResponseTs: message.ts,
			username: 'username',
		});
	});

	// This should never happpen on the wild, checking because of a data inconsistency bug found
	it('should update only the lastMessageTs property when a room has both waitingResponse and responseBy properties', async () => {
		const message = { u: { _id: '1234', username: 'username' }, ts: new Date() };
		const room = {
			waitingResponse: true,
			responseBy: { _id: '1234', username: 'username', firstResponseTs: new Date() },
			v: { _id: '1234' },
		};

		const res = await markRoomResponded(message, room, {});

		expect(res).to.be.deep.equal({
			_id: '1234',
			username: 'username',
			firstResponseTs: room.responseBy.firstResponseTs,
			lastMessageTs: message.ts,
		});
	});
});
