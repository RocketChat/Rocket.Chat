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

const { Push } = proxyquire.noCallThru().load('../../../../../../server/lib/notifications/push/push', {
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
	});
});
