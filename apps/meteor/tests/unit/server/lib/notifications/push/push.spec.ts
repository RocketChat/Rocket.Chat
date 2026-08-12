import type { IPushNotificationConfig } from '@rocket.chat/core-typings/src/IPushNotificationConfig';
import type { IPushToken } from '@rocket.chat/core-typings/src/IPushToken';
import { pick, truncateString } from '@rocket.chat/tools';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const loggerStub = { debug: sinon.stub(), warn: sinon.stub(), error: sinon.stub(), info: sinon.stub(), log: sinon.stub() };
const settingsStub = { get: sinon.stub().returns('') };
const sendAPNStub = sinon.stub();
const sendFCMStub = sinon.stub();
const pushTokenStub = {
	findAllTokensByUserId: sinon.stub().returns([]),
	findTokensByUserIdExceptId: sinon.stub().returns([]),
	estimatedDocumentCount: sinon.stub().resolves(0),
	countApnTokens: sinon.stub().resolves(0),
	countGcmTokens: sinon.stub().resolves(0),
	removeByTokenString: sinon.stub().resolves({ deletedCount: 0 }),
};

const { Push } = proxyquire.noCallThru().load('../../../../../../server/lib/notifications/push/push', {
	'./logger': { logger: loggerStub },
	'../../../settings': { settings: settingsStub },
	'./apn': { initAPN: sinon.stub(), sendAPN: sendAPNStub, shutdownAPN: sinon.stub() },
	'./fcm': { sendFCM: sendFCMStub },
	'@rocket.chat/models': { PushToken: pushTokenStub },
	'@rocket.chat/license': { License: { hasOfflineLicense: () => false } },
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

	describe('sendNotificationNative() token routing', () => {
		const makePushToken = (overrides: Partial<IPushToken>): IPushToken => ({
			_id: 'token-id',
			tokenType: 'apn',
			tokenValue: 'TOKEN',
			appName: 'app',
			userId: 'user1',
			enabled: true,
			authToken: 'auth',
			createdAt: new Date(),
			_updatedAt: new Date(),
			...overrides,
		});

		beforeEach(() => {
			sendAPNStub.resetHistory();
			sendFCMStub.resetHistory();
			settingsStub.get.returns('');
			Push.options = { apn: {}, gcm: {} };
		});

		it('sends a regular notification to an apn document via APN with the plain topic', async () => {
			const app = makePushToken({ tokenType: 'apn', tokenValue: 'APN_TOKEN' });
			await Push.sendNotificationNative(app, { useVoipToken: false }, [], []);
			expect(sendAPNStub.calledOnce).to.be.true;
			expect(sendAPNStub.firstCall.args[0].userToken).to.equal('APN_TOKEN');
			expect(sendAPNStub.firstCall.args[0].notification.topic).to.equal('app');
		});

		it('sends a voip notification to a voip document via APN with the .voip topic', async () => {
			const app = makePushToken({ tokenType: 'voip', tokenValue: 'VOIP_TOKEN' });
			await Push.sendNotificationNative(app, { useVoipToken: true }, [], []);
			expect(sendAPNStub.calledOnce).to.be.true;
			expect(sendAPNStub.firstCall.args[0].userToken).to.equal('VOIP_TOKEN');
			expect(sendAPNStub.firstCall.args[0].notification.topic).to.equal('app.voip');
		});

		it('skips an apn document when the notification is voip', async () => {
			const app = makePushToken({ tokenType: 'apn', tokenValue: 'APN_TOKEN' });
			await Push.sendNotificationNative(app, { useVoipToken: true }, [], []);
			expect(sendAPNStub.called).to.be.false;
			expect(sendFCMStub.called).to.be.false;
		});

		it('skips a voip document when the notification is regular', async () => {
			const app = makePushToken({ tokenType: 'voip', tokenValue: 'VOIP_TOKEN' });
			await Push.sendNotificationNative(app, { useVoipToken: false }, [], []);
			expect(sendAPNStub.called).to.be.false;
			expect(sendFCMStub.called).to.be.false;
		});

		it('sends a regular notification to a gcm document via FCM', async () => {
			sinon.stub(Push, 'getNativeNotificationAuthorizationCredentials').resolves({ token: 'FCM_AUTH', projectId: 'proj' });
			const app = makePushToken({ tokenType: 'gcm', tokenValue: 'GCM_TOKEN' });
			await Push.sendNotificationNative(app, { useVoipToken: false }, [], []);
			expect(sendFCMStub.calledOnce).to.be.true;
			expect(sendFCMStub.firstCall.args[0].userTokens).to.equal('GCM_TOKEN');
		});

		it('still sends a voip notification to a gcm document, since Android has no separate voip token', async () => {
			sinon.stub(Push, 'getNativeNotificationAuthorizationCredentials').resolves({ token: 'FCM_AUTH', projectId: 'proj' });
			const app = makePushToken({ tokenType: 'gcm', tokenValue: 'GCM_TOKEN' });
			await Push.sendNotificationNative(app, { useVoipToken: true }, [], []);
			expect(sendFCMStub.calledOnce).to.be.true;
			expect(sendFCMStub.firstCall.args[0].userTokens).to.equal('GCM_TOKEN');
		});
	});

	describe('sendNotificationGateway() token routing', () => {
		const makePushToken = (overrides: Partial<IPushToken>): IPushToken => ({
			_id: 'token-id',
			tokenType: 'apn',
			tokenValue: 'TOKEN',
			appName: 'app',
			userId: 'user1',
			enabled: true,
			authToken: 'auth',
			createdAt: new Date(),
			_updatedAt: new Date(),
			...overrides,
		});

		let sendGatewayPushStub: sinon.SinonStub;

		beforeEach(() => {
			settingsStub.get.returns('');
			Push.options = { gateways: ['https://gateway.example'] };
			sendGatewayPushStub = sinon.stub(Push, 'sendGatewayPush').resolves();
		});

		it('routes a voip notification to the voip document with the .voip topic', async () => {
			await Push.sendNotificationGateway(makePushToken({ tokenType: 'voip', tokenValue: 'VOIP_TOKEN' }), { useVoipToken: true }, [], []);
			expect(sendGatewayPushStub.calledOnce).to.be.true;
			expect(sendGatewayPushStub.firstCall.args[1]).to.equal('apn');
			expect(sendGatewayPushStub.firstCall.args[2]).to.equal('VOIP_TOKEN');
			expect(sendGatewayPushStub.firstCall.args[3].topic).to.equal('app.voip');
		});

		it('skips the apn document when the notification is voip', async () => {
			await Push.sendNotificationGateway(makePushToken({ tokenType: 'apn', tokenValue: 'APN_TOKEN' }), { useVoipToken: true }, [], []);
			expect(sendGatewayPushStub.called).to.be.false;
		});

		it('still routes a voip notification to a gcm document, since Android has no separate voip token', async () => {
			await Push.sendNotificationGateway(makePushToken({ tokenType: 'gcm', tokenValue: 'GCM_TOKEN' }), { useVoipToken: true }, [], []);
			expect(sendGatewayPushStub.calledOnce).to.be.true;
			expect(sendGatewayPushStub.firstCall.args[1]).to.equal('gcm');
			expect(sendGatewayPushStub.firstCall.args[2]).to.equal('GCM_TOKEN');
		});
	});

	describe('sendNotification() resilience', () => {
		const makePushToken = (overrides: Partial<IPushToken>): IPushToken => ({
			_id: 'token-id',
			tokenType: 'apn',
			tokenValue: 'TOKEN',
			appName: 'app',
			userId: 'user1',
			enabled: true,
			authToken: 'auth',
			createdAt: new Date(),
			_updatedAt: new Date(),
			...overrides,
		});

		beforeEach(() => {
			sendAPNStub.resetHistory();
			sendFCMStub.resetHistory();
			settingsStub.get.returns('');
			Push.options = { apn: {}, gcm: {} };
		});

		it('keeps delivering to the remaining devices when one token document cannot be routed', async () => {
			// A document left on the legacy schema (no tokenType) used to throw out of the loop,
			// silently dropping the notification for every device queued behind it.
			const legacy = makePushToken({ _id: 'legacy', tokenType: undefined as unknown as IPushToken['tokenType'] });
			const healthy = makePushToken({ _id: 'healthy', tokenType: 'apn', tokenValue: 'APN_TOKEN' });
			pushTokenStub.findAllTokensByUserId.returns([legacy, healthy]);

			const result = await Push.sendNotification({ userId: 'user1', useVoipToken: false });

			expect(sendAPNStub.calledOnce).to.be.true;
			expect(sendAPNStub.firstCall.args[0].userToken).to.equal('APN_TOKEN');
			expect(result.apn).to.deep.equal(['healthy']);
		});
	});
});
