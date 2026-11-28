import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const room = { _id: 'room', servedBy: { _id: 'agent', ts: new Date(), username: 'agent' }, v: { _id: 'visitor' } };
const rooms = { findOpenByAgent: sinon.stub(), claimAutoForward: sinon.stub(), releaseAutoForward: sinon.stub() };
const transferRoom = sinon.stub();
const findVisitor = sinon.stub();

let forwardOpenChats: typeof import('./transfer').forwardOpenChats;

before(async () => {
	mockModel('Users', { findOneById: sinon.stub().resolves({ _id: 'agent', username: 'agent' }) });
	mockModel('LivechatRooms', rooms);
	mockModel('LivechatVisitors', { findOneEnabledById: findVisitor });
	mockModel('LivechatDepartment', { findOneById: sinon.stub().resolves({ _id: 'department', name: 'Department' }) });
	mock.module('./Helper', { exports: { normalizeTransferredByData: sinon.stub().returns({ _id: 'agent' }) } });
	mock.module('./RoutingManager', { exports: { RoutingManager: { transferRoom } } });
	({ forwardOpenChats } = await import('./transfer'));
});

describe('forwardOpenChats', () => {
	beforeEach(() => {
		rooms.findOpenByAgent.returns([room]);
		rooms.claimAutoForward.reset();
		rooms.claimAutoForward.resolves(room);
		rooms.releaseAutoForward.reset();
		rooms.releaseAutoForward.resolves();
		findVisitor.resolves({ _id: 'visitor', department: 'department' });
		transferRoom.reset();
		transferRoom.resolves(true);
	});

	it('forwards only from the worker that claimed the assignment', async () => {
		rooms.claimAutoForward.onSecondCall().resolves(null);

		await Promise.all([forwardOpenChats('agent'), forwardOpenChats('agent')]);

		expect(rooms.claimAutoForward.callCount).to.equal(2);
		expect(transferRoom.calledOnce).to.be.true;
		expect(rooms.releaseAutoForward.calledOnceWithExactly('room', rooms.claimAutoForward.firstCall.args[2].token)).to.be.true;
	});

	it('releases the claim when the transfer fails', async () => {
		transferRoom.rejects(new Error('transfer failed'));

		await expect(forwardOpenChats('agent')).to.be.rejectedWith('transfer failed');

		expect(rooms.releaseAutoForward.calledOnceWithExactly('room', rooms.claimAutoForward.firstCall.args[2].token)).to.be.true;
	});
});
