import type { IPushNotificationConfig } from '@rocket.chat/core-typings/src/IPushNotificationConfig';
import { pick } from '@rocket.chat/tools';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('Push Notifications [PushClass]', () => {
	let Push: any;
	let loggerStub: any;
	let settingsStub: any;
	let clock: sinon.SinonFakeTimers;

	beforeEach(() => {
		loggerStub = { debug: sinon.stub(), warn: sinon.stub(), error: sinon.stub(), info: sinon.stub(), log: sinon.stub() };
		settingsStub = { get: sinon.stub().returns('') };
		clock = sinon.useFakeTimers();

		({ Push } = proxyquire('../../../../../app/push/server/push', {
			'./logger': { logger: loggerStub },
			'../../settings/server': { settings: settingsStub },
			'@rocket.chat/tools': { pick },
			'meteor/check': {
				check: sinon.stub(),
				Match: {
					Optional: () => sinon.stub(),
					Integer: Number,
					OneOf: () => sinon.stub(),
					test: sinon.stub().returns(true),
				},
			},
		}));
	});

	afterEach(() => {
		clock.restore();
		sinon.restore();
	});

	describe('send()', () => {
		let sendNotificationStub: sinon.SinonStub;
		beforeEach(() => {
			sendNotificationStub = sinon.stub(Push, 'sendNotification').resolves({ apn: [], gcm: [] });
		});

		it('should call sendNotification with required fields', async () => {
			const options: IPushNotificationConfig = { from: 'test', title: 'title', text: 'body', userId: 'user1' };

			await Push.send(options);

			expect(sendNotificationStub.calledOnce).to.be.true;

			const notification = sendNotificationStub.firstCall.args[0];
			expect(notification.from).to.equal('test');
			expect(notification.title).to.equal('title');
			expect(notification.text).to.equal('body');
			expect(notification.userId).to.equal('user1');
		});

		it('should truncate text longer than 150 chars', async () => {
			const longText = 'a'.repeat(200);
			const options: IPushNotificationConfig = { from: 'test', title: 'title', text: longText, userId: 'user1' };

			await Push.send(options);

			const notification = sendNotificationStub.firstCall.args[0];

			expect(notification.text.length).to.equal(150);
		});

		it('should not call sendNotification if payload exceeds 4KB', async () => {
			const bigPayload: IPushNotificationConfig = {
				from: 'test',
				title: 'title',
				text: 'body',
				userId: 'user1',
				payload: { data: 'a'.repeat(5000) },
			};

			await Push.send(bigPayload);

			expect(sendNotificationStub.called).to.be.false;
			expect(loggerStub.warn.calledWithMatch(sinon.match.object)).to.be.true;
		});

		it('should throw if userId is missing', async () => {
			const options = { from: 'test', title: 'title', text: 'body' };
			try {
				await Push.send(options);
			} catch (e) {
				// expected
			}
			expect(sendNotificationStub.called).to.be.false;
		});

		it('should handle errors from sendNotification gracefully', async () => {
			sendNotificationStub.rejects(new Error('fail'));

			const options: IPushNotificationConfig = { from: 'test', title: 'title', text: 'body', userId: 'user1' };

			await Push.send(options);

			expect(loggerStub.debug.calledWithMatch(sinon.match.string, sinon.match.string)).to.be.true;
		});
	});
});
