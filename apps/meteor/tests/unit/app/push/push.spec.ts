import type { IPushNotificationConfig } from '@rocket.chat/core-typings/src/IPushNotificationConfig';
import { expect } from 'chai';
import sinon from 'sinon';
import { describe, it, beforeEach, afterEach, vi } from 'vitest';

const { loggerStub, settingsStub, checkMock, matchMock, meteorMock, pick, truncateString } = vi.hoisted(() => {
	const sinon = require('sinon');

	const { pick, truncateString } = require('@rocket.chat/tools');
	return {
		pick,
		truncateString,
		loggerStub: { debug: sinon.stub(), warn: sinon.stub(), error: sinon.stub(), info: sinon.stub(), log: sinon.stub() },
		settingsStub: { get: sinon.stub().returns('') },
		checkMock: sinon.stub(),
		matchMock: {
			Optional: () => sinon.stub(),
			Integer: Number,
			OneOf: () => sinon.stub(),
			test: sinon.stub().returns(true),
		},
		meteorMock: {
			absoluteUrl: sinon.stub().returns('http://localhost'),
		},
	};
});

vi.mock('../../../../app/push/server/logger', () => ({ logger: loggerStub }));
vi.mock('../../../../app/settings/server', () => ({ settings: settingsStub }));
vi.mock('@rocket.chat/tools', () => ({ pick, truncateString }));
vi.mock('meteor/check', () => ({
	check: checkMock,
	Match: matchMock,
}));
vi.mock('meteor/meteor', () => ({
	Meteor: meteorMock,
}));

const { Push } = await import('../../../../app/push/server/push');

describe('Push Notifications [PushClass]', () => {
	afterEach(() => {
		sinon.restore();
	});

	describe('send()', () => {
		let sendNotificationStub: sinon.SinonStub;
		beforeEach(() => {
			sendNotificationStub = sinon
				.stub(Push as unknown as { sendNotification: () => Promise<{ apn: string[]; gcm: string[] }> }, 'sendNotification')
				.resolves({ apn: [], gcm: [] });
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
			} as unknown as IPushNotificationConfig;

			await expect(Push.send(options)).to.be.rejectedWith('No userId found');

			expect(sendNotificationStub.called).to.be.false;
		});
	});
});
