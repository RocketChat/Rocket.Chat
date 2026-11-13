import { before, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const { auditGetMessagesMethod, auditGetOmnichannelMessagesMethod } = proxyquire.noCallThru().load('./functions', {
	'@rocket.chat/core-services': { ClientSafeError },
	'../../../../server/lib/authorization/hasPermission': { hasPermissionAsync: sinon.stub().resolves(true) },
	'../../../../server/lib/callbacks': { callbacks: { run: sinon.stub() } },
	'../../../../server/lib/i18n': { i18n: { t: (key: string) => key } },
	'../../../../server/lib/statistics': { updateCounter: sinon.stub() },
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
