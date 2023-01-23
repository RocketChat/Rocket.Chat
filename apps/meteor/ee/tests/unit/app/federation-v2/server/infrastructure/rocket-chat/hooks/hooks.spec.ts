/* eslint-disable */
import proxyquire from 'proxyquire';
import { expect } from 'chai';
import sinon from 'sinon';

const remove = sinon.stub();
const get = sinon.stub();
const hooks: Record<string, any> = {};

const { FederationHooksEE } = proxyquire
	.noCallThru()
	.load('../../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/hooks', {
		'meteor/meteor': {
			'@global': true,
		},
		'meteor/random': {
			'Random': {
				id: () => 1,
			},
			'@global': true,
		},
		'../../../../../../../lib/callbacks': {
			callbacks: {
				priority: { HIGH: 'high' },
				remove,
				add: (_name: string, callback: (...args: any[]) => void, _priority: string, _id: string) => (hooks[_id] = callback),
			},
		},
		'../../../../../../../app/settings/server': {
			settings: { get },
		},
	});

describe('FederationEE - Infrastructure - RocketChat - Hooks', () => {
	beforeEach(() => {
		Promise.await = (args) => args;
	});

	afterEach(() => {
		remove.reset();
		get.reset();
	});

	describe('#onFederatedRoomCreated()', () => {
		it('should NOT execute the callback if no room was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if the provided room is not federated', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']({});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no params were provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']({ federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no owner was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']({ federated: true }, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no member list was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']({ federated: true }, { owner: 'owner' });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			get.returns(false);
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']({ federated: true }, { owner: 'owner', originalMemberList: [] });
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']({ federated: true }, { owner: 'owner', originalMemberList: [] });
			expect(stub.calledWith({ federated: true }, 'owner', [])).to.be.true;
		});
	});

	describe('#onUsersAddedToARoom()', () => {
		it('should NOT execute the callback if no room was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-users-to-a-room']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if the provided room is not federated', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-users-to-a-room']({}, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no params were provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-users-to-a-room']({}, { federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no user was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-users-to-a-room']({}, { federated: true }, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no inviter was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-users-to-a-room']({ user: 'user' }, { federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			get.returns(false);
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-users-to-a-room']({ user: 'user', inviter: 'inviter' }, { federated: true });
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-users-to-a-room']({ user: 'user', inviter: 'inviter' }, { federated: true });
			expect(stub.calledWith({ federated: true }, 'inviter', ['user'])).to.be.true;
		});
	});

	describe('#onDirectMessageRoomCreated()', () => {
		it('should NOT execute the callback if no room was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if the provided room is not federated', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']({}, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no params were provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']({ federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no members was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']({ federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no creatorId was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']({ federated: true }, { members: [] });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			get.returns(false);
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']({ federated: true }, { creatorId: 'creatorId', members: [] });
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']({ federated: true }, { creatorId: 'creatorId', members: [] });
			expect(stub.calledWith({ federated: true }, 'creatorId', [])).to.be.true;
		});
	});

	describe('#beforeDirectMessageRoomCreate()', () => {
		it('should NOT execute the callback if no members was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.beforeDirectMessageRoomCreate(stub);
			hooks['federation-v2-before-create-direct-message-room']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			get.returns(false);
			const stub = sinon.stub();
			FederationHooksEE.beforeDirectMessageRoomCreate(stub);
			hooks['federation-v2-before-create-direct-message-room']([]);
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.beforeDirectMessageRoomCreate(stub);
			hooks['federation-v2-before-create-direct-message-room']([]);
			expect(stub.calledWith([])).to.be.true;
		});
	});

	describe('#beforeAddUserToARoom()', () => {
		it('should NOT execute the callback if no room was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.beforeAddUserToARoom(stub);
			hooks['federation-v2-before-add-user-to-the-room']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if the provided room is not federated', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.beforeAddUserToARoom(stub);
			hooks['federation-v2-before-add-user-to-the-room']({}, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no params were provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.beforeAddUserToARoom(stub);
			hooks['federation-v2-before-add-user-to-the-room']({}, { federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no user was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.beforeAddUserToARoom(stub);
			hooks['federation-v2-before-add-user-to-the-room']({}, { federated: true }, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			get.returns(false);
			const stub = sinon.stub();
			FederationHooksEE.beforeAddUserToARoom(stub);
			hooks['federation-v2-before-add-user-to-the-room']({ user: 'user', inviter: 'inviter' }, { federated: true });
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.beforeAddUserToARoom(stub);
			hooks['federation-v2-before-add-user-to-the-room']({ user: 'user', inviter: 'inviter' }, { federated: true });
			expect(stub.calledWith('user', { federated: true }, 'inviter')).to.be.true;
		});
	});

	describe('#afterRoomNameChanged()', () => {
		
		it('should NOT execute the callback if no params was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.afterRoomNameChanged(stub);
			hooks['federation-v2-after-room-name-changed']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no roomId was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.afterRoomNameChanged(stub);
			hooks['federation-v2-after-room-name-changed']({});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no roomName was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.afterRoomNameChanged(stub);
			hooks['federation-v2-after-room-name-changed']({ rid: 'roomId' });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			get.returns(false);
			const stub = sinon.stub();
			FederationHooksEE.afterRoomNameChanged(stub);
			hooks['federation-v2-after-room-name-changed']({ rid: 'roomId', name: 'roomName' });
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.afterRoomNameChanged(stub);
			hooks['federation-v2-after-room-name-changed']({ rid: 'roomId', name: 'roomName' });
			expect(stub.calledWith('roomId', 'roomName')).to.be.true;
		});
	});

	describe('#afterRoomTopicChanged()', () => {
		
		it('should NOT execute the callback if no params was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.afterRoomTopicChanged(stub);
			hooks['federation-v2-after-room-topic-changed']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no roomId was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.afterRoomTopicChanged(stub);
			hooks['federation-v2-after-room-topic-changed']({});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no topic was provided', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.afterRoomTopicChanged(stub);
			hooks['federation-v2-after-room-topic-changed']({ rid: 'roomId' });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			get.returns(false);
			const stub = sinon.stub();
			FederationHooksEE.afterRoomTopicChanged(stub);
			hooks['federation-v2-after-room-topic-changed']({ rid: 'roomId', topic: 'topic' });
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			get.returns(true);
			const stub = sinon.stub();
			FederationHooksEE.afterRoomTopicChanged(stub);
			hooks['federation-v2-after-room-topic-changed']({ rid: 'roomId', topic: 'topic' });
			expect(stub.calledWith('roomId', 'topic')).to.be.true;
		});
	});

	describe('#removeAll()', () => {
		it('should remove the specific validation for EE environments', () => {
			FederationHooksEE.removeAll();
			expect(remove.callCount).to.be.equal(7);
			expect(remove.getCall(0).calledWith('beforeCreateDirectRoom', 'federation-v2-before-create-direct-message-room')).to.be.equal(true);
			expect(remove.getCall(1).calledWith('afterCreateDirectRoom', 'federation-v2-after-create-direct-message-room')).to.be.equal(true);
			expect(remove.getCall(2).calledWith('afterAddedToRoom', 'federation-v2-after-add-users-to-a-room')).to.be.equal(true);
			expect(remove.getCall(3).calledWith('federation.afterCreateFederatedRoom', 'federation-v2-after-create-room')).to.be.equal(true);
			expect(remove.getCall(4).calledWith('federation.beforeAddUserAToRoom', 'federation-v2-before-add-user-to-the-room')).to.be.equal(
				true,
			);
			expect(remove.getCall(5).calledWith('afterRoomNameChange', 'federation-v2-after-room-name-changed')).to.be.equal(true);
			expect(remove.getCall(6).calledWith('afterRoomTopicChange', 'federation-v2-after-room-topic-changed')).to.be.equal(true);
		});
	});
});
