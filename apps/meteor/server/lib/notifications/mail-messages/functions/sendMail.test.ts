import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const user = {
	_id: 'user1',
	name: 'User One',
	emails: [{ address: 'user1@rocket.chat' }],
	createdAt: new Date(1700000000000),
};

const mocks = {
	Users: {
		findOneByEmailAddress: sinon.stub(),
		find: sinon.stub(),
	},
	Mailer: {
		checkAddressFormatAndThrow: sinon.stub(),
		send: sinon.stub().resolves(),
	},
};

let sendMail: typeof import('./sendMail').sendMail;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/core-services', { exports: { ClientSafeError: Error } }),
		mock.module('../../../logger/system', { exports: { SystemLogger: { debug: sinon.stub() } } }),
		mock.module('../../../utils/getURL', { exports: { getWorkspaceURL: (path: string) => `https://open.rocket.chat/${path}` } }),
		mock.module('../../../utils/placeholders', {
			exports: {
				placeholders: { replace: (body: string, data: { unsubscribe: string }) => body.replace('[unsubscribe]', data.unsubscribe) },
			},
		}),
		mock.module('../../email/api', { exports: { default: mocks.Mailer } }),
	];
	({ sendMail } = await import('./sendMail'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

const unsubscribeUrl = `https://open.rocket.chat/mailer/unsubscribe/user1/${user.createdAt.getTime()}`;

describe('sendMail', () => {
	before(() => {
		mockModel('Users', mocks.Users);
	});

	beforeEach(() => {
		mocks.Mailer.send.resetHistory();
		mocks.Users.findOneByEmailAddress.resolves(user);
		mocks.Users.find.returns({ toArray: async () => [user] });
	});

	it('should send an absolute unsubscribe link to every user', async () => {
		await sendMail({ from: 'admin@rocket.chat', subject: 'News', body: 'Bye: [unsubscribe]' });

		expect(mocks.Mailer.send.firstCall.args[0].html).to.equal(`Bye: ${unsubscribeUrl}`);
	});

	it('should send an absolute unsubscribe link on a dry run', async () => {
		await sendMail({ from: 'admin@rocket.chat', subject: 'News', body: 'Bye: [unsubscribe]', dryrun: true });

		expect(mocks.Mailer.send.firstCall.args[0].html).to.equal(`Bye: ${unsubscribeUrl}`);
	});
});
