import type { IPushNotificationConfig } from '@rocket.chat/core-typings/src/IPushNotificationConfig';
import { pick, truncateString } from '@rocket.chat/tools';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const loggerStub = { debug: sinon.stub(), warn: sinon.stub(), error: sinon.stub(), info: sinon.stub(), log: sinon.stub() };
const settingsStub = { get: sinon.stub().returns('') };

const { Push } = proxyquire.noCallThru().load('../../../../app/push/server/push', {
	'./logger': { logger: loggerStub },
	'../../settings/server': { settings: settingsStub },
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
});
