import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class FakeIMAP extends EventEmitter {
	static instances: FakeIMAP[] = [];

	state = 'disconnected';

	connect = sinon.stub();

	seq = { addFlags: sinon.stub() };

	fetchedMessages: number[] = [];

	fetch = sinon.stub().callsFake(() => {
		const fetch = new EventEmitter();
		setImmediate(() => {
			for (const seqno of this.fetchedMessages) {
				const message = new EventEmitter();
				fetch.emit('message', message, seqno);
				message.emit('body', new PassThrough(), {});
			}
			fetch.emit('end');
		});
		return fetch;
	});

	constructor() {
		super();
		FakeIMAP.instances.push(this);
	}
}

const simpleParser = sinon.stub();

const { IMAPInterceptor } = proxyquire.noCallThru().load('./IMAPInterceptor', {
	'imap': FakeIMAP,
	'mailparser': { simpleParser },
	'@rocket.chat/models': { EmailInbox: {} },
	'../features/EmailInbox/logger': { logger: { info: sinon.stub(), error: sinon.stub(), warn: sinon.stub(), debug: sinon.stub() } },
	'../lib/notifyListener': { notifyOnEmailInboxChanged: sinon.stub() },
});

const createInterceptor = (deleteAfterRead: boolean) => {
	FakeIMAP.instances = [];
	const interceptor = new IMAPInterceptor({ user: 'inbox@test' }, { deleteAfterRead, filter: ['UNSEEN'], markSeen: true, maxRetries: 10 }, 'id');
	return { interceptor, imap: FakeIMAP.instances[0] };
};

describe('IMAPInterceptor.imapFetch', () => {
	it('flags each fetched message as deleted by its sequence number', async () => {
		simpleParser.callsFake((_stream, cb) => cb(null, { subject: 'Hello' }));
		const { interceptor, imap } = createInterceptor(true);
		imap.fetchedMessages = [7];

		await interceptor.imapFetch([7]);

		expect(imap.seq.addFlags.calledOnce).to.be.true;
		expect(imap.seq.addFlags.firstCall.args[0]).to.equal(7);
		expect(imap.seq.addFlags.firstCall.args[1]).to.equal('Deleted');
	});

	it('keeps fetched messages when deleting after read is off', async () => {
		simpleParser.callsFake((_stream, cb) => cb(null, { subject: 'Hello' }));
		const { interceptor, imap } = createInterceptor(false);
		imap.fetchedMessages = [7];

		await interceptor.imapFetch([7]);

		expect(imap.seq.addFlags.called).to.be.false;
	});
});
