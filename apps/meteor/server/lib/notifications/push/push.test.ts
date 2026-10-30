import { afterEach, beforeEach, describe, it } from 'node:test';

import type { IPushNotificationConfig } from '@rocket.chat/core-typings/src/IPushNotificationConfig';
import { pick, truncateString } from '@rocket.chat/tools';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const loggerStub = { debug: sinon.stub(), warn: sinon.stub(), error: sinon.stub(), info: sinon.stub(), log: sinon.stub() };
const settingsStub = { get: sinon.stub().returns('') };
const sendAPNStub = sinon.stub();
const sendFCMStub = sinon.stub();
const pushTokenModelStub = { findAllTokensByUserId: sinon.stub() };

const { Push } = proxyquire.noCallThru().load('./push', {
	'@rocket.chat/models': { PushToken: pushTokenModelStub },
	'@rocket.chat/license': { License: { hasOfflineLicense: () => false } },
	'./logger': { logger: loggerStub },
	'../../../settings': { settings: settingsStub },
	'./apn': { initAPN: sinon.stub(), sendAPN: sendAPNStub, shutdownAPN: sinon.stub() },
	'./fcm': { sendFCM: sendFCMStub },
	'@rocket.chat/tools': { pick, truncateString },
	'meteor/check': {
		check: sinon.stub(),
		Match: {
			Optional: () => sinon.stub(),
			Integer: Number,
			OneOf: () => sinon.stub(),
			test: sinon.stub().returns(true),
		},
	},
	'meteor/meteor': {
		Meteor: {
			absoluteUrl: sinon.stub().returns('http://localhost'),
		},
	},
});

describe('Push Notifications [PushClass]', () => {
	afterEach(() => {
		sinon.restore();
	});

	describe('send()', () => {
		let sendNotificationStub: sinon.SinonStub;
		beforeEach(() => {
			sendNotificationStub = sinon.stub(Push, 'sendNotification').resolves({ apn: [], gcm: [] });
		});

		it('should call sendNotification with required fields', async () => {
			const options: IPushNotificationConfig = {
				from: 'test',
				title: 'title',
				text: 'body',
				userId: 'user1',
				apn: { category: 'MESSAGE' },
				gcm: { style: 'inbox', image: 'url' },
			};

			await Push.send(options);

			expect(sendNotificationStub.calledOnce).to.be.true;

			const notification = sendNotificationStub.firstCall.args[0];
			expect(notification.from).to.equal('test');
			expect(notification.title).to.equal('title');
			expect(notification.text).to.equal('body');
			expect(notification.userId).to.equal('user1');
		});

		it('should truncate text if longer than 240 chars', async () => {
			const longText = 'a'.repeat(300);
			const options: IPushNotificationConfig = {
				from: 'test',
				title: 'title',
				text: longText,
				userId: 'user1',
				apn: { category: 'MESSAGE' },
				gcm: { style: 'inbox', image: 'url' },
			};

			await Push.send(options);

			const notification = sendNotificationStub.firstCall.args[0];

			expect(notification.text.length).to.equal(240);
		});

		it('should truncate title if longer than 65 chars', async () => {
			const longTitle = 'a'.repeat(100);
			const options: IPushNotificationConfig = {
				from: 'test',
				title: longTitle,
				text: 'bpdu',
				userId: 'user1',
				apn: { category: 'MESSAGE' },
				gcm: { style: 'inbox', image: 'url' },
			};

			await Push.send(options);

			const notification = sendNotificationStub.firstCall.args[0];

			expect(notification.title.length).to.equal(65);
		});

		it('should throw if userId is missing', async () => {
			const options = {
				from: 'test',
				title: 'title',
				text: 'body',
				apn: { category: 'MESSAGE' },
				gcm: { style: 'inbox', image: 'url' },
			};

			await expect(Push.send(options)).to.be.rejectedWith('No userId found');

			expect(sendNotificationStub.called).to.be.false;
		});
	});

	describe('sendNotification() through the gateway', () => {
		const notification = { userId: 'user1', title: 'title', text: 'body', createdAt: new Date(), createdBy: '<SERVER>' };
		const pendingGatewayRequests: (() => void)[] = [];
		const isSettled = (promise: Promise<unknown>) =>
			Promise.race([promise.then(() => true), new Promise((resolve) => setTimeout(resolve, 10, false))]);

		let sendNotificationGatewayStub: sinon.SinonStub;

		beforeEach(() => {
			settingsStub.get.returns(true);
			Push.options = { gateways: ['https://gateway.rocket.chat'] };
			sendNotificationGatewayStub = sinon
				.stub(Push, 'sendNotificationGateway')
				.callsFake(() => new Promise<void>((resolve) => pendingGatewayRequests.push(resolve)));
		});

		afterEach(() => {
			pendingGatewayRequests.splice(0).forEach((resolve) => resolve());
			settingsStub.get.returns('');
		});

		it('does not wait for the gateway to answer', async () => {
			pushTokenModelStub.findAllTokensByUserId.returns([{ _id: 'token-1', tokenType: 'gcm', tokenValue: 'GCM_TOKEN' }]);

			expect(await isSettled(Push.sendNotification(notification))).to.be.true;
			expect(sendNotificationGatewayStub.calledOnce).to.be.true;
		});

		it('waits for a gateway request to finish before starting a 51st', async () => {
			pushTokenModelStub.findAllTokensByUserId.returns(
				Array.from({ length: 51 }, (_, i) => ({ _id: `token-${i}`, tokenType: 'gcm', tokenValue: `GCM_TOKEN_${i}` })),
			);

			const sending = Push.sendNotification(notification);

			expect(await isSettled(sending)).to.be.false;
			expect(sendNotificationGatewayStub.callCount).to.equal(50);
			pendingGatewayRequests.shift()?.();
			expect(await isSettled(sending)).to.be.true;
			expect(sendNotificationGatewayStub.callCount).to.equal(51);
		});

		it('keeps concurrent senders within 50 gateway requests in flight', async () => {
			pushTokenModelStub.findAllTokensByUserId.returns(
				Array.from({ length: 30 }, (_, i) => ({ _id: `token-${i}`, tokenType: 'gcm', tokenValue: `GCM_TOKEN_${i}` })),
			);

			const sending = [Push.sendNotification(notification), Push.sendNotification(notification)];

			expect(await isSettled(Promise.all(sending))).to.be.false;
			expect(sendNotificationGatewayStub.callCount).to.equal(50);
		});

		it('logs a failed gateway request instead of rejecting', async () => {
			pushTokenModelStub.findAllTokensByUserId.returns([{ _id: 'token-1', tokenType: 'gcm', tokenValue: 'GCM_TOKEN' }]);
			sendNotificationGatewayStub.rejects(new Error('gateway down'));
			loggerStub.error.resetHistory();

			await Push.sendNotification(notification);
			await new Promise(setImmediate);

			expect(loggerStub.error.calledWithMatch({ msg: 'Error sending push to gateway' })).to.be.true;
		});
	});
});
