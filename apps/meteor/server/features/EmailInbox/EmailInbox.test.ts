import { EventEmitter } from 'node:events';
import { before, beforeEach, describe, it } from 'node:test';

import type { IEmailInbox } from '@rocket.chat/core-typings';
import type { IEmailInboxModel, IEmailMessageHistoryModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class FakeIMAPInterceptor extends EventEmitter {
	static instances: FakeIMAPInterceptor[] = [];

	static failingUser: string | undefined;

	start = sinon.stub().callsFake(async () => {
		if (this.imapConfig.user === FakeIMAPInterceptor.failingUser) {
			throw new Error('auth failed');
		}
	});

	stop = sinon.stub();

	constructor(
		public imapConfig: Record<string, unknown>,
		public options: Record<string, unknown>,
		public id: string,
	) {
		super();
		FakeIMAPInterceptor.instances.push(this);
	}

	receive(email: Record<string, unknown>) {
		return Promise.all(this.listeners('email').map((listener) => listener(email)));
	}
}

const models = {
	EmailInbox: { findActive: sinon.stub() },
	EmailMessageHistory: { create: sinon.stub() },
};
const onEmailReceived = sinon.stub();

const { configureEmailInboxes, inboxes } = proxyquire.noCallThru().load('./EmailInbox', {
	'meteor/meteor': { Meteor: { startup: sinon.stub() } },
	'./EmailInbox_Incoming': { onEmailReceived },
	'./logger': { logger: { info: sinon.stub(), error: sinon.stub() } },
	'../../email/IMAPInterceptor': { IMAPInterceptor: FakeIMAPInterceptor },
	'../../settings': { settings: {} },
});

const createInbox = (email: string, overrides: Partial<IEmailInbox> = {}): IEmailInbox => ({
	_id: `id-${email}`,
	_createdAt: new Date('2026-01-01T00:00:00Z'),
	_updatedAt: new Date('2026-01-01T00:00:00Z'),
	_createdBy: null,
	active: true,
	name: email,
	email,
	senderInfo: '',
	department: 'dep1',
	imap: { server: 'imap.test', port: 993, username: email, password: 'imap-pass', secure: false, maxRetries: 5 },
	smtp: { server: 'smtp.test', port: 465, username: email, password: 'smtp-pass', secure: true },
	...overrides,
});

describe('configureEmailInboxes', () => {
	before(() => {
		registerModel('IEmailInboxModel', models.EmailInbox as unknown as IEmailInboxModel);
		registerModel('IEmailMessageHistoryModel', models.EmailMessageHistory as unknown as IEmailMessageHistoryModel);
	});

	beforeEach(() => {
		FakeIMAPInterceptor.instances = [];
		FakeIMAPInterceptor.failingUser = undefined;
		inboxes.clear();
		models.EmailInbox.findActive.reset();
		models.EmailMessageHistory.create.reset();
		models.EmailMessageHistory.create.resolves();
		onEmailReceived.reset();
	});

	it('should stop the previous interceptors and keep only the active inboxes', async () => {
		models.EmailInbox.findActive.returns([createInbox('old@test')]);
		await configureEmailInboxes();
		const [oldInterceptor] = FakeIMAPInterceptor.instances;

		const secureInbox = createInbox('secure@test', { imap: { ...createInbox('secure@test').imap, secure: true } });
		models.EmailInbox.findActive.returns([createInbox('plain@test'), secureInbox]);
		await configureEmailInboxes();

		expect(oldInterceptor.stop.calledOnce).to.be.true;
		expect([...inboxes.keys()]).to.deep.equal(['plain@test', 'secure@test']);
		expect(inboxes.get('secure@test').config).to.equal(secureInbox);
		expect(inboxes.get('secure@test').imap.imapConfig).to.deep.include({
			tls: true,
			tlsOptions: { rejectUnauthorized: false },
			host: 'imap.test',
			user: 'secure@test',
		});
		expect(inboxes.get('plain@test').imap.imapConfig).to.not.have.property('tls');
		expect(inboxes.get('secure@test').smtp.options).to.deep.equal({
			host: 'smtp.test',
			port: 465,
			secure: true,
			auth: { user: 'secure@test', pass: 'smtp-pass' },
		});
	});

	it('should keep configuring the other inboxes when one fails to start', async () => {
		models.EmailInbox.findActive.returns([createInbox('broken@test'), createInbox('ok@test')]);
		FakeIMAPInterceptor.failingUser = 'broken@test';

		await configureEmailInboxes();

		expect([...inboxes.keys()]).to.deep.equal(['ok@test']);
	});

	it('should record the email in the history and then process it for the inbox department', async () => {
		models.EmailInbox.findActive.returns([createInbox('support@test', { department: 'sales' })]);
		await configureEmailInboxes();
		const email = { messageId: '<m1@mail>', subject: 'Hello' };

		await FakeIMAPInterceptor.instances[0].receive(email);

		expect(models.EmailMessageHistory.create.calledOnceWith({ _id: '<m1@mail>', email: 'support@test' })).to.be.true;
		expect(onEmailReceived.calledOnceWith(email, 'support@test', 'sales')).to.be.true;
	});

	it('should ignore an email without a message id', async () => {
		models.EmailInbox.findActive.returns([createInbox('support@test')]);
		await configureEmailInboxes();

		await FakeIMAPInterceptor.instances[0].receive({ subject: 'No id' });

		expect(models.EmailMessageHistory.create.called).to.be.false;
		expect(onEmailReceived.called).to.be.false;
	});

	it('should not process an email whose history record already exists', async () => {
		models.EmailInbox.findActive.returns([createInbox('support@test')]);
		await configureEmailInboxes();
		models.EmailMessageHistory.create.rejects(new Error('E11000 duplicate key'));

		await FakeIMAPInterceptor.instances[0].receive({ messageId: '<m1@mail>' });

		expect(onEmailReceived.called).to.be.false;
	});
});
