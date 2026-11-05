import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class FakeIMAPInterceptor extends EventEmitter {
	static lastOptions: Record<string, unknown>;

	constructor(_imapConfig: unknown, options: Record<string, unknown>) {
		super();
		FakeIMAPInterceptor.lastOptions = options;
	}
}

const settingValues: Record<string, unknown> = {};

const { DirectReplyIMAPInterceptor } = proxyquire.noCallThru().load('./interceptDirectReplyEmails', {
	'@rocket.chat/poplib': { __esModule: true, default: class {} },
	'mailparser': { simpleParser: sinon.stub() },
	'./processDirectEmail': { processDirectEmail: sinon.stub() },
	'../../email/IMAPInterceptor': { IMAPInterceptor: FakeIMAPInterceptor },
	'../../settings': { settings: { get: (id: string) => settingValues[id] } },
});

describe('DirectReplyIMAPInterceptor', () => {
	it('searches for unseen mail, marks it seen and retries failed connections', () => {
		settingValues.Direct_Reply_Delete = false;

		new DirectReplyIMAPInterceptor();

		expect(FakeIMAPInterceptor.lastOptions).to.deep.equal({
			filter: ['UNSEEN'],
			markSeen: true,
			maxRetries: 10,
			deleteAfterRead: false,
		});
	});

	it('deletes read mail when the Direct_Reply_Delete setting is on', () => {
		settingValues.Direct_Reply_Delete = true;

		new DirectReplyIMAPInterceptor();

		expect(FakeIMAPInterceptor.lastOptions.deleteAfterRead).to.be.true;
	});
});
