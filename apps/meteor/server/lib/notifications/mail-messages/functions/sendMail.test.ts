import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
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

const { sendMail } = proxyquire.noCallThru().load('./sendMail', {
	'@rocket.chat/core-services': { ClientSafeError: Error },
	'@rocket.chat/models': { Users: mocks.Users },
	'../../../logger/system': { SystemLogger: { debug: sinon.stub() } },
	'../../../utils/getURL': { getWorkspaceURL: (path: string) => `https://open.rocket.chat/${path}` },
	'../../../utils/placeholders': {
		placeholders: { replace: (body: string, data: { unsubscribe: string }) => body.replace('[unsubscribe]', data.unsubscribe) },
	},
	'../../email/api': mocks.Mailer,
});

const unsubscribeUrl = `https://open.rocket.chat/mailer/unsubscribe/user1/${user.createdAt.getTime()}`;

describe('sendMail', () => {
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
