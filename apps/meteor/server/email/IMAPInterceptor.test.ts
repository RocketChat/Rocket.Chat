import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class FakeIMAP extends EventEmitter {
	static instances: FakeIMAP[] = [];

	state = 'disconnected';

	connect = sinon.stub();

	search = sinon.stub().callsFake((_criteria: unknown, cb: (err: Error | null, results: number[]) => void) => cb(null, []));

	openBox = sinon.stub().callsFake((_name: string, _readOnly: boolean, cb: (err: Error | null, box: object) => void) => cb(null, {}));

	fetch = sinon.stub().callsFake(() => {
		const fetch = new EventEmitter();
		setImmediate(() => fetch.emit('end'));
		return fetch;
	});

	constructor() {
		super();
		FakeIMAP.instances.push(this);
	}
}

const { IMAPInterceptor } = proxyquire.noCallThru().load('./IMAPInterceptor', {
	'imap': FakeIMAP,
	'mailparser': { simpleParser: sinon.stub() },
	'@rocket.chat/models': { EmailInbox: {} },
	'../features/EmailInbox/logger': { logger: { info: sinon.stub(), error: sinon.stub(), warn: sinon.stub(), debug: sinon.stub() } },
	'../lib/notifyListener': { notifyOnEmailInboxChanged: sinon.stub() },
});

const options = { deleteAfterRead: false, filter: ['UNSEEN'], markSeen: true, maxRetries: 10 };

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('IMAPInterceptor', () => {
	it('opens a single connection when started', async () => {
		FakeIMAP.instances = [];
		const interceptor = new IMAPInterceptor({ user: 'inbox@test' }, options, 'inbox-id');

		await interceptor.start();

		const [imap] = FakeIMAP.instances;
		expect(imap.connect.calledOnce).to.be.true;
	});

	it('searches the mailbox once per new mail notification', async () => {
		FakeIMAP.instances = [];
		const interceptor = new IMAPInterceptor({ user: 'inbox@test' }, options, 'inbox-id');
		await interceptor.start();
		const [imap] = FakeIMAP.instances;
		imap.state = 'authenticated';

		imap.emit('ready');
		await flush();
		imap.emit('mail');
		await flush();

		expect(imap.openBox.calledOnce).to.be.true;
		expect(imap.search.calledOnce).to.be.true;
	});
});
