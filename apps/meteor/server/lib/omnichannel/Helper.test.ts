import { before, beforeEach, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatInquiry: {
		findOneByRoomId: sinon.stub(),
		changeDepartmentIdByRoomId: sinon.stub(),
		readyInquiry: sinon.stub(),
		findOneById: sinon.stub(),
	},
	Users: {
		findOneOnlineAgentById: sinon.stub(),
	},
	LivechatDepartmentAgents: {
		findOneByAgentIdAndDepartmentId: sinon.stub(),
	},
	LivechatDepartment: {
		findOneById: sinon.stub(),
	},
	LivechatRooms: {
		changeDepartmentIdByRoomId: sinon.stub(),
		removeAgentByRoomId: sinon.stub(),
	},
	Subscriptions: {
		changeDepartmentByRoomId: sinon.stub(),
	},
};

class MockLogger {
	debug() {
		return null;
	}

	error() {
		return null;
	}

	warn() {
		return null;
	}

	info() {
		return null;
	}
}

const callbacksRun = sinon.stub();
const settingsGet = sinon.stub();
const saveSystemMessage = sinon.stub();
const isWithinMACLimit = sinon.stub();
const broadcast = sinon.stub();
const queueInquiry = sinon.stub();
const checkOnlineAgents = sinon.stub();
const saveTransferHistory = sinon.stub();
const notifyOnRoomChangedById = sinon.stub();
const notifyOnLivechatInquiryChangedByRoom = sinon.stub();
const notifyOnSubscriptionChangedByRoomId = sinon.stub();
const routingManager = {
	getConfig: sinon.stub(),
	unassignAgent: sinon.stub(),
	delegateInquiry: sinon.stub(),
	removeAllRoomSubscriptions: sinon.stub(),
};

const { forwardRoomToDepartment } = proxyquire.noCallThru().load('./Helper', {
	'@rocket.chat/apps': { Apps: { self: undefined }, AppEvents: {} },
	'@rocket.chat/core-services': {
		api: { broadcast },
		Message: { saveSystemMessage },
		Omnichannel: { isWithinMACLimit },
		ClientSafeError,
	},
	'@rocket.chat/logger': { Logger: MockLogger },
	'./QueueManager': { queueInquiry, saveQueueInquiry: sinon.stub() },
	'./RoutingManager': { RoutingManager: routingManager },
	'./contacts/isVerifiedChannelInSource': { isVerifiedChannelInSource: sinon.stub() },
	'./contacts/migrateVisitorIfMissingContact': { migrateVisitorIfMissingContact: sinon.stub() },
	'./hooks': { afterRoomQueued: sinon.stub(), beforeNewRoom: sinon.stub() },
	'./service-status': { checkOnlineAgents, getOnlineAgents: sinon.stub() },
	'./transfer': { saveTransferHistory },
	'../../hooks/messages/sendNotificationsOnMessage': { sendNotification: sinon.stub() },
	'../../settings': { settings: { get: settingsGet } },
	'../authorization/hasRole': { hasRoleAsync: sinon.stub() },
	'../callbacks': { callbacks: { run: callbacksRun } },
	'../i18n': { i18n: { t: sinon.stub() } },
	'../notifyListener': {
		notifyOnLivechatDepartmentAgentChanged: sinon.stub(),
		notifyOnLivechatDepartmentAgentChangedByAgentsAndDepartmentId: sinon.stub(),
		notifyOnSubscriptionChangedById: sinon.stub(),
		notifyOnSubscriptionChangedByRoomId,
		notifyOnSubscriptionChanged: sinon.stub(),
		notifyOnRoomChangedById,
		notifyOnLivechatInquiryChangedByRoom,
	},
});

describe('forwardRoomToDepartment', () => {
	const guest = { _id: 'visitor-id', token: 'visitor-token' };
	let room: any;
	let inquiry: any;
	let transferData: any;

	before(() => {
		mockModel('LivechatInquiry', modelsMock.LivechatInquiry);
		mockModel('Users', modelsMock.Users);
		mockModel('LivechatDepartmentAgents', modelsMock.LivechatDepartmentAgents);
		mockModel('LivechatDepartment', modelsMock.LivechatDepartment);
		mockModel('LivechatRooms', modelsMock.LivechatRooms);
		mockModel('Subscriptions', modelsMock.Subscriptions);
	});

	beforeEach(() => {
		Object.values(modelsMock).forEach((model) => Object.values(model).forEach((stub) => stub.reset()));
		[
			callbacksRun,
			settingsGet,
			saveSystemMessage,
			isWithinMACLimit,
			broadcast,
			queueInquiry,
			checkOnlineAgents,
			saveTransferHistory,
			notifyOnRoomChangedById,
			notifyOnLivechatInquiryChangedByRoom,
			notifyOnSubscriptionChangedByRoomId,
			...Object.values(routingManager),
		].forEach((stub) => stub.reset());

		room = {
			_id: 'room-id',
			open: true,
			departmentId: 'old-dep',
			servedBy: { _id: 'agent-1', username: 'agent1' },
			v: { token: 'visitor-token' },
		};
		inquiry = { _id: 'inquiry-id', rid: 'room-id', department: 'old-dep' };
		transferData = {
			departmentId: 'new-dep',
			transferredBy: { _id: 'transferrer-id', username: 'transferrer', userType: 'agent' },
		};

		modelsMock.LivechatInquiry.findOneByRoomId.resolves(inquiry);
		modelsMock.LivechatDepartment.findOneById.resolves({ name: 'New Dep', fallbackForwardDepartment: 'fallback-dep' });
		modelsMock.LivechatRooms.changeDepartmentIdByRoomId.resolves({ modifiedCount: 1 });
		modelsMock.LivechatInquiry.changeDepartmentIdByRoomId.resolves({ modifiedCount: 1 });
		modelsMock.Subscriptions.changeDepartmentByRoomId.resolves({ modifiedCount: 1 });
		routingManager.getConfig.returns({ autoAssignAgent: true });
		isWithinMACLimit.resolves(true);
		checkOnlineAgents.resolves(true);
		settingsGet.returns(false);
	});

	it('should return false without running any callback when the room is not open', async () => {
		const result = await forwardRoomToDepartment({ ...room, open: false }, guest, transferData);

		expect(result).to.be.false;
		expect(callbacksRun.notCalled).to.be.true;
		expect(modelsMock.LivechatInquiry.findOneByRoomId.notCalled).to.be.true;
	});

	it('should run the before-forward callback and throw when the room has no inquiry', async () => {
		modelsMock.LivechatInquiry.findOneByRoomId.resolves(null);

		await expect(forwardRoomToDepartment(room, guest, transferData)).to.be.rejectedWith('error-transferring-inquiry');
		expect(callbacksRun.calledOnceWithExactly('livechat.beforeForwardRoomToDepartment', { room, transferData })).to.be.true;
		expect(modelsMock.LivechatInquiry.findOneByRoomId.calledOnceWithExactly('room-id', {})).to.be.true;
	});

	it('should throw when no department is provided', async () => {
		await expect(forwardRoomToDepartment(room, guest, { ...transferData, departmentId: undefined })).to.be.rejectedWith(
			'error-transferring-inquiry-no-department',
		);
	});

	it('should throw when forwarding to the department the room is already in', async () => {
		await expect(forwardRoomToDepartment(room, guest, { ...transferData, departmentId: 'old-dep' })).to.be.rejectedWith(
			'error-forwarding-chat-same-department',
		);
		expect(modelsMock.LivechatDepartment.findOneById.notCalled).to.be.true;
	});

	it('should throw when the target agent is not online', async () => {
		settingsGet.withArgs('Livechat_enabled_when_agent_idle').returns(true);
		modelsMock.Users.findOneOnlineAgentById.resolves(null);

		await expect(forwardRoomToDepartment(room, guest, { ...transferData, userId: 'agent-2' })).to.be.rejectedWith('error-user-is-offline');
		expect(modelsMock.Users.findOneOnlineAgentById.calledOnceWithExactly('agent-2', true, false, {})).to.be.true;
		expect(modelsMock.LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId.notCalled).to.be.true;
	});

	it('should throw when the target agent does not belong to the department', async () => {
		modelsMock.Users.findOneOnlineAgentById.resolves({ _id: 'agent-2', username: 'agent2' });
		modelsMock.LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId.resolves(null);

		await expect(forwardRoomToDepartment(room, guest, { ...transferData, userId: 'agent-2' })).to.be.rejectedWith(
			'error-user-not-belong-to-department',
		);
		expect(
			modelsMock.LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId.calledOnceWithExactly('agent-2', 'new-dep', {
				projection: { _id: 1 },
			}),
		).to.be.true;
	});

	it('should put the room on the department queue with the target agent when routing is manual', async () => {
		routingManager.getConfig.returns({ autoAssignAgent: false });
		routingManager.unassignAgent.resolves('unassigned');
		modelsMock.Users.findOneOnlineAgentById.resolves({ _id: 'agent-2', username: 'agent2' });
		modelsMock.LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId.resolves({ _id: 'rel' });
		const data = { ...transferData, userId: 'agent-2' };

		const result = await forwardRoomToDepartment(room, guest, data);

		expect(result).to.equal('unassigned');
		expect(saveTransferHistory.calledOnceWithExactly(room, data)).to.be.true;
		expect(routingManager.unassignAgent.calledOnceWithExactly(inquiry, 'new-dep', true, { agentId: 'agent-2', username: 'agent2' })).to.be
			.true;
		expect(saveTransferHistory.calledBefore(routingManager.unassignAgent)).to.be.true;
		expect(routingManager.delegateInquiry.notCalled).to.be.true;
	});

	it('should put the room on the department queue when the workspace is over the MAC limit', async () => {
		isWithinMACLimit.resolves(false);

		await forwardRoomToDepartment(room, guest, transferData);

		expect(isWithinMACLimit.calledOnceWithExactly(room)).to.be.true;
		expect(routingManager.unassignAgent.calledOnceWithExactly(inquiry, 'new-dep', true, null)).to.be.true;
		expect(routingManager.delegateInquiry.notCalled).to.be.true;
	});

	it('should put the room on the department queue when the department accepts offline forwards and has no online agents', async () => {
		modelsMock.LivechatDepartment.findOneById.resolves({ name: 'New Dep', allowReceiveForwardOffline: true });
		checkOnlineAgents.resolves(false);

		await forwardRoomToDepartment(room, guest, transferData);

		expect(checkOnlineAgents.calledOnceWithExactly('new-dep')).to.be.true;
		expect(routingManager.unassignAgent.calledOnce).to.be.true;
		expect(routingManager.delegateInquiry.notCalled).to.be.true;
	});

	it('should put the room on the department queue when the waiting queue is enabled and agents are online', async () => {
		settingsGet.withArgs('Livechat_waiting_queue').returns(true);

		await forwardRoomToDepartment(room, guest, transferData);

		expect(routingManager.unassignAgent.calledOnce).to.be.true;
		expect(routingManager.delegateInquiry.notCalled).to.be.true;
	});

	it('should delegate the inquiry to the new department and return false when nobody takes it', async () => {
		routingManager.delegateInquiry.resolves(null);

		const result = await forwardRoomToDepartment(room, guest, { ...transferData, clientAction: true });

		expect(result).to.be.false;
		expect(
			routingManager.delegateInquiry.calledOnceWithExactly(
				{ ...inquiry, department: 'new-dep' },
				null,
				{ forwardingToDepartment: { oldDepartmentId: 'old-dep' }, clientAction: true },
				room,
			),
		).to.be.true;
		expect(
			modelsMock.LivechatDepartment.findOneById.calledOnceWithExactly('new-dep', {
				projection: { allowReceiveForwardOffline: 1, fallbackForwardDepartment: 1, name: 1 },
			}),
		).to.be.true;
		expect(saveTransferHistory.notCalled).to.be.true;
	});

	describe('when the chat ends up with the same agent that served it before', () => {
		beforeEach(() => {
			routingManager.delegateInquiry.resolves({ servedBy: { _id: 'agent-1' }, chatQueued: false });
		});

		it('should throw when the department has no fallback department', async () => {
			modelsMock.LivechatDepartment.findOneById.resolves({ name: 'New Dep' });

			await expect(forwardRoomToDepartment(room, guest, transferData)).to.be.rejectedWith(
				'error-no-agents-available-for-service-on-department',
			);
			expect(callbacksRun.calledWith('livechat:onTransferFailure')).to.be.false;
			expect(saveTransferHistory.notCalled).to.be.true;
		});

		it('should throw when the department fallback is an empty string', async () => {
			modelsMock.LivechatDepartment.findOneById.resolves({ name: 'New Dep', fallbackForwardDepartment: '' });

			await expect(forwardRoomToDepartment(room, guest, transferData)).to.be.rejectedWith(
				'error-no-agents-available-for-service-on-department',
			);
		});

		it('should throw when the department does not exist', async () => {
			modelsMock.LivechatDepartment.findOneById.resolves(null);

			await expect(forwardRoomToDepartment(room, guest, transferData)).to.be.rejectedWith(
				'error-no-agents-available-for-service-on-department',
			);
		});

		it('should record the original department name and return true when the fallback transfer succeeds', async () => {
			const department = { name: 'New Dep', fallbackForwardDepartment: 'fallback-dep' };
			modelsMock.LivechatDepartment.findOneById.resolves(department);
			callbacksRun.withArgs('livechat:onTransferFailure').resolves(true);

			const result = await forwardRoomToDepartment(room, guest, transferData);

			expect(result).to.be.true;
			expect(transferData.originalDepartmentName).to.equal('New Dep');
			expect(callbacksRun.calledWithExactly('livechat:onTransferFailure', room, { guest, transferData, department })).to.be.true;
			expect(saveTransferHistory.notCalled).to.be.true;
			expect(modelsMock.LivechatRooms.changeDepartmentIdByRoomId.notCalled).to.be.true;
			expect(saveSystemMessage.notCalled).to.be.true;
		});

		it('should keep an existing original department name', async () => {
			callbacksRun.withArgs('livechat:onTransferFailure').resolves(true);
			const data = { ...transferData, originalDepartmentName: 'First Dep' };

			await forwardRoomToDepartment(room, guest, data);

			expect(data.originalDepartmentName).to.equal('First Dep');
		});

		it('should return true when the fallback callback returns the room unchanged', async () => {
			callbacksRun.withArgs('livechat:onTransferFailure').resolves(room);

			const result = await forwardRoomToDepartment(room, guest, transferData);

			expect(result).to.be.true;
		});

		it('should return false when the fallback transfer fails', async () => {
			callbacksRun.withArgs('livechat:onTransferFailure').resolves(false);

			const result = await forwardRoomToDepartment(room, guest, transferData);

			expect(result).to.be.false;
			expect(transferData.originalDepartmentName).to.equal('New Dep');
			expect(saveTransferHistory.notCalled).to.be.true;
		});

		it('should finish the transfer instead of falling back when the chat was queued', async () => {
			routingManager.delegateInquiry.resolves({ servedBy: { _id: 'agent-1' }, chatQueued: true });
			modelsMock.LivechatInquiry.findOneById.resolves({ _id: 'inquiry-id', status: 'ready' });

			const result = await forwardRoomToDepartment(room, guest, transferData);

			expect(result).to.be.true;
			expect(callbacksRun.calledWith('livechat:onTransferFailure')).to.be.false;
			expect(saveTransferHistory.calledOnce).to.be.true;
		});
	});

	it('should finish the transfer without falling back when the room had no previous agent', async () => {
		routingManager.delegateInquiry.resolves({ servedBy: { _id: 'agent-1' }, chatQueued: false });

		const result = await forwardRoomToDepartment({ ...room, servedBy: undefined }, guest, transferData);

		expect(result).to.be.true;
		expect(callbacksRun.calledWith('livechat:onTransferFailure')).to.be.false;
		expect(routingManager.removeAllRoomSubscriptions.notCalled).to.be.true;
		expect(saveTransferHistory.calledOnce).to.be.true;
	});

	it('should move the room to the new department when another agent takes it', async () => {
		const servedBy = { _id: 'agent-2', username: 'agent2' };
		routingManager.delegateInquiry.resolves({ servedBy, chatQueued: false });

		const result = await forwardRoomToDepartment(room, guest, transferData);

		expect(result).to.be.true;
		expect(saveSystemMessage.notCalled).to.be.true;
		expect(saveTransferHistory.calledOnceWithExactly(room, transferData)).to.be.true;
		expect(routingManager.removeAllRoomSubscriptions.calledOnceWithExactly(room, servedBy)).to.be.true;
		expect(modelsMock.LivechatRooms.changeDepartmentIdByRoomId.calledOnceWithExactly('room-id', 'new-dep')).to.be.true;
		expect(modelsMock.LivechatInquiry.changeDepartmentIdByRoomId.calledOnceWithExactly('room-id', 'new-dep')).to.be.true;
		expect(modelsMock.Subscriptions.changeDepartmentByRoomId.calledOnceWithExactly('room-id', 'new-dep')).to.be.true;
		expect(notifyOnRoomChangedById.calledOnceWithExactly('room-id')).to.be.true;
		expect(notifyOnLivechatInquiryChangedByRoom.calledOnceWithExactly('room-id')).to.be.true;
		expect(notifyOnSubscriptionChangedByRoomId.calledOnceWithExactly('room-id')).to.be.true;
		expect(
			callbacksRun.calledWithExactly('livechat.afterForwardChatToDepartment', {
				rid: 'room-id',
				newDepartmentId: 'new-dep',
				oldDepartmentId: 'old-dep',
			}),
		).to.be.true;
		expect(saveTransferHistory.calledBefore(routingManager.removeAllRoomSubscriptions)).to.be.true;
		expect(routingManager.removeAllRoomSubscriptions.calledBefore(modelsMock.LivechatRooms.changeDepartmentIdByRoomId)).to.be.true;
		expect(modelsMock.LivechatInquiry.readyInquiry.notCalled).to.be.true;
		expect(queueInquiry.notCalled).to.be.true;
	});

	it('should save a fallback transfer message with the visitor token when a visitor transfers using the fallback department', async () => {
		routingManager.delegateInquiry.resolves({ servedBy: { _id: 'agent-2' }, chatQueued: false });
		const data = {
			...transferData,
			usingFallbackDep: true,
			originalDepartmentName: 'First Dep',
			transferredBy: { _id: 'visitor-id', username: 'visitor', userType: 'visitor' },
		};

		await forwardRoomToDepartment(room, guest, data);

		expect(
			saveSystemMessage.calledOnceWithExactly(
				'livechat_transfer_history_fallback',
				'room-id',
				'',
				{ _id: 'visitor-id', username: 'visitor' },
				{ token: 'visitor-token', transferData: { ...data, prevDepartment: 'First Dep' } },
			),
		).to.be.true;
		expect(saveSystemMessage.calledBefore(saveTransferHistory)).to.be.true;
	});

	it('should save a fallback transfer message without a token when an agent transfers using the fallback department', async () => {
		routingManager.delegateInquiry.resolves({ servedBy: { _id: 'agent-2' }, chatQueued: false });
		const data = { ...transferData, usingFallbackDep: true, originalDepartmentName: 'First Dep' };

		await forwardRoomToDepartment(room, guest, data);

		expect(
			saveSystemMessage.calledOnceWithExactly(
				'livechat_transfer_history_fallback',
				'room-id',
				'',
				{ _id: 'transferrer-id', username: 'transferrer' },
				{ transferData: { ...data, prevDepartment: 'First Dep' } },
			),
		).to.be.true;
	});

	it('should mark the inquiry ready and queue it again when the chat was queued', async () => {
		const newInquiry = { _id: 'inquiry-id', status: 'ready' };
		routingManager.delegateInquiry.resolves({ servedBy: { _id: 'agent-2' }, chatQueued: true });
		modelsMock.LivechatInquiry.findOneById.resolves(newInquiry);

		const result = await forwardRoomToDepartment(room, guest, transferData);

		expect(result).to.be.true;
		expect(routingManager.removeAllRoomSubscriptions.calledOnceWithExactly(room, undefined)).to.be.true;
		expect(modelsMock.LivechatInquiry.readyInquiry.calledOnceWithExactly('inquiry-id')).to.be.true;
		expect(modelsMock.LivechatRooms.removeAgentByRoomId.calledOnceWithExactly('room-id')).to.be.true;
		expect(broadcast.calledOnceWithExactly('omnichannel.room', 'room-id', { type: 'agentData', data: undefined })).to.be.true;
		expect(modelsMock.LivechatInquiry.findOneById.calledOnceWithExactly('inquiry-id')).to.be.true;
		expect(queueInquiry.calledOnceWithExactly(newInquiry)).to.be.true;
		sinon.assert.callOrder(
			modelsMock.LivechatRooms.changeDepartmentIdByRoomId,
			modelsMock.LivechatInquiry.readyInquiry,
			modelsMock.LivechatRooms.removeAgentByRoomId,
			broadcast,
			modelsMock.LivechatInquiry.findOneById,
			queueInquiry,
		);
	});

	it('should throw when the queued inquiry disappears after the transfer', async () => {
		routingManager.delegateInquiry.resolves({ servedBy: { _id: 'agent-2' }, chatQueued: true });
		modelsMock.LivechatInquiry.findOneById.resolves(null);

		await expect(forwardRoomToDepartment(room, guest, transferData)).to.be.rejectedWith('error-invalid-inquiry');
		expect(queueInquiry.notCalled).to.be.true;
	});
});
