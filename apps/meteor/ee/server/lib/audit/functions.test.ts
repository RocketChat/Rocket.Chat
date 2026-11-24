import { before, describe, it, mock } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

let auditGetMessagesMethod: any;
let auditGetOmnichannelMessagesMethod: any;

before(async () => {
	mock.module('@rocket.chat/core-services', { exports: { ClientSafeError } });
	mock.module('../../../../server/lib/authorization/hasPermission', { exports: { hasPermissionAsync: sinon.stub().resolves(true) } });
	mock.module('../../../../server/lib/callbacks', { exports: { callbacks: { run: sinon.stub() } } });
	mock.module('../../../../server/lib/i18n', { exports: { i18n: { t: (key: string) => key } } });
	mock.module('../../../../server/lib/statistics', { exports: { updateCounter: sinon.stub() } });
	({ auditGetMessagesMethod, auditGetOmnichannelMessagesMethod } = await import('./functions'));
});

const storedMessage = () => ({
	_id: 'msg1',
	rid: 'room1',
	msg: 'hello',
	ts: new Date(),
	u: { _id: 'author', username: 'alice', name: 'Alice', emails: [{ address: 'alice@example.com', verified: true }] },
});

const params = { startDate: new Date(0), endDate: new Date(), users: [], msg: '', type: '' };

describe('audit functions', () => {
	before(() => {
		mockModel('Users', { findOneById: sinon.stub().resolves({ _id: 'auditor', username: 'auditor' }) });
		mockModel('Rooms', { findOne: sinon.stub().resolves({ _id: 'room1', name: 'general' }) });
		mockModel('LivechatRooms', { findByVisitorIdAndAgentId: sinon.stub().returns({ toArray: async () => [{ _id: 'room1' }] }) });
		mockModel('Messages', { find: () => ({ toArray: async () => [storedMessage()] }) });
		mockModel('AuditLog', { insertOne: sinon.stub().resolves() });
	});

	it('should return only the public identity of message authors', async () => {
		const [message] = await auditGetMessagesMethod('auditor', { ...params, rid: 'room1' });

		expect(message.u).to.deep.equal({ _id: 'author', username: 'alice', name: 'Alice' });
	});

	it('should return only the public identity of omnichannel message authors', async () => {
		const [message] = await auditGetOmnichannelMessagesMethod('auditor', { ...params, visitor: 'visitor', agent: 'agent' });

		expect(message.u).to.deep.equal({ _id: 'author', username: 'alice', name: 'Alice' });
	});
});
