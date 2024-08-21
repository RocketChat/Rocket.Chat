import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const remove = sinon.stub();
const throwIfFederationNotEnabledOrNotReady = sinon.stub();
const hooks: Record<string, any> = {};

const { FederationHooksEE } = proxyquire
	.noCallThru()
	.load('../../../../../../../../server/local-services/federation/infrastructure/rocket-chat/hooks', {
		'meteor/meteor': {
			'@global': true,
		},
		'@rocket.chat/random': {
			'Random': {
				id: () => 1,
			},
			'@global': true,
		},
		'../../../../../../../lib/callbacks': {
			callbacks: {
				priority: { HIGH: 'high' },
				remove,
				add: (_name: string, callback: (...args: any[]) => void, _priority: string, _id: string) => {
					hooks[_id] = callback;
					return callback;
				},
			},
		},
		'../../../../../../../server/services/federation/utils': {
			throwIfFederationNotEnabledOrNotReady,
		},
	});

describe('FederationEE - Infrastructure - RocketChat - Hooks', () => {
	afterEach(() => {
		remove.reset();
		throwIfFederationNotEnabledOrNotReady.reset();
	});

	describe('#onFederatedRoomCreated()', () => {
		it('should NOT execute the callback if no room was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if the provided room is not federated', () => {
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']({});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no params were provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']({ federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no owner was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']({ federated: true }, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no member list was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']({ federated: true }, { owner: 'owner' });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			const error = new Error();
			throwIfFederationNotEnabledOrNotReady.throws(error);
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			expect(
				hooks['federation-v2-after-create-room']({ federated: true }, { owner: 'owner', originalMemberList: [] }),
			).to.have.rejectedWith(error);
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			const stub = sinon.stub();
			FederationHooksEE.onFederatedRoomCreated(stub);
			hooks['federation-v2-after-create-room']({ federated: true }, { owner: 'owner', originalMemberList: [] });
			expect(stub.calledWith({ federated: true }, 'owner', [])).to.be.true;
		});
	});

	describe('#onUsersAddedToARoom() - afterAddedToRoom', () => {
		it('should NOT execute the callback if no room was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-user-to-a-room']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if the provided room is not federated', () => {
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-user-to-a-room']({}, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no params were provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-user-to-a-room']({}, { federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no user was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-user-to-a-room']({}, { federated: true }, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			const error = new Error();
			throwIfFederationNotEnabledOrNotReady.throws(error);
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			expect(
				hooks['federation-v2-after-add-user-to-a-room']({ user: 'user', inviter: 'inviter' }, { federated: true }),
			).to.have.rejectedWith(error);
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-user-to-a-room']({ user: 'user', inviter: 'inviter' }, { federated: true });
			expect(stub.calledWith({ federated: true }, ['user'], 'inviter')).to.be.true;
		});

		it('should execute the callback even if there is no inviter (when auto-joining)', () => {
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-after-add-user-to-a-room']({ user: 'user' }, { federated: true });
			expect(stub.calledWith({ federated: true }, ['user'])).to.be.true;
		});
	});
	describe('#onUsersAddedToARoom() - federation.onAddUsersToARoom', () => {
		it('should NOT execute the callback if no room was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-on-add-users-to-a-room']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if the provided room is not federated', () => {
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-on-add-users-to-a-room']({}, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no params were provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-on-add-users-to-a-room']({}, { federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no user was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-on-add-users-to-a-room']({}, { federated: true }, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no inviter was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-on-add-users-to-a-room']({ invitees: ['user'] }, { federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			const error = new Error();
			throwIfFederationNotEnabledOrNotReady.throws(error);
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			expect(
				hooks['federation-v2-on-add-users-to-a-room']({ invitees: ['user'], inviter: 'inviter' }, { federated: true }),
			).to.have.rejectedWith(error);
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			const stub = sinon.stub();
			FederationHooksEE.onUsersAddedToARoom(stub);
			hooks['federation-v2-on-add-users-to-a-room']({ invitees: ['user'], inviter: 'inviter' }, { federated: true });
			expect(stub.calledWith({ federated: true }, ['user'], 'inviter')).to.be.true;
		});
	});

	describe('#onDirectMessageRoomCreated()', () => {
		it('should NOT execute the callback if no room was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if the provided room is not federated', () => {
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']({}, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no params were provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']({ federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no members was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']({ federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no creatorId was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']({ federated: true }, { members: [] });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			const error = new Error();
			throwIfFederationNotEnabledOrNotReady.throws(error);
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			expect(
				hooks['federation-v2-after-create-direct-message-room']({ federated: true }, { creatorId: 'creatorId', members: [] }),
			).to.have.rejectedWith(error);
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			const stub = sinon.stub();
			FederationHooksEE.onDirectMessageRoomCreated(stub);
			hooks['federation-v2-after-create-direct-message-room']({ federated: true }, { creatorId: 'creatorId', members: [] });
			expect(stub.calledWith({ federated: true }, 'creatorId', [])).to.be.true;
		});
	});

	describe('#beforeDirectMessageRoomCreate()', () => {
		it('should NOT execute the callback if no members was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.beforeDirectMessageRoomCreate(stub);
			hooks['federation-v2-before-create-direct-message-room']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			const error = new Error();
			throwIfFederationNotEnabledOrNotReady.throws(error);
			const stub = sinon.stub();
			FederationHooksEE.beforeDirectMessageRoomCreate(stub);
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			expect(hooks['federation-v2-before-create-direct-message-room']([])).to.have.rejectedWith(error);
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			const stub = sinon.stub();
			FederationHooksEE.beforeDirectMessageRoomCreate(stub);
			hooks['federation-v2-before-create-direct-message-room']([]);
			expect(stub.calledWith([])).to.be.true;
		});
	});

	describe('#beforeAddUserToARoom()', () => {
		it('should NOT execute the callback if no room was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.beforeAddUserToARoom(stub);
			hooks['federation-v2-before-add-user-to-the-room']();
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if the provided room is not federated', () => {
			const stub = sinon.stub();
			FederationHooksEE.beforeAddUserToARoom(stub);
			hooks['federation-v2-before-add-user-to-the-room']({}, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no params were provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.beforeAddUserToARoom(stub);
			hooks['federation-v2-before-add-user-to-the-room']({}, { federated: true });
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if no user was provided', () => {
			const stub = sinon.stub();
			FederationHooksEE.beforeAddUserToARoom(stub);
			hooks['federation-v2-before-add-user-to-the-room']({}, { federated: true }, {});
			expect(stub.called).to.be.false;
		});

		it('should NOT execute the callback if federation module was disabled', () => {
			const error = new Error();
			throwIfFederationNotEnabledOrNotReady.throws(error);
			const stub = sinon.stub();
			FederationHooksEE.beforeAddUserToARoom(stub);
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			expect(
				hooks['federation-v2-before-add-user-to-the-room']({ user: 'user', inviter: 'inviter' }, { federated: true }),
			).to.have.rejectedWith(error);
			expect(stub.called).to.be.false;
		});

		it('should execute the callback when everything is correct', () => {
			const stub = sinon.stub();
			FederationHooksEE.beforeAddUserToARoom(stub);
			hooks['federation-v2-before-add-user-to-the-room']({ user: 'user', inviter: 'inviter' }, { federated: true });
			expect(stub.calledWith('user', { federated: true }, 'inviter')).to.be.true;
		});
	});

	describe('#removeAllListeners()', () => {
		it('should remove the specific validation for EE environments', () => {
			FederationHooksEE.removeAllListeners();
			expect(remove.callCount).to.be.equal(6);
			expect(remove.getCall(0).calledWith('beforeCreateDirectRoom', 'federation-v2-before-create-direct-message-room')).to.be.equal(true);
			expect(remove.getCall(1).calledWith('afterCreateDirectRoom', 'federation-v2-after-create-direct-message-room')).to.be.equal(true);
			expect(remove.getCall(2).calledWith('federation.onAddUsersToARoom', 'federation-v2-on-add-users-to-a-room')).to.be.equal(true);
			expect(remove.getCall(3).calledWith('afterAddedToRoom', 'federation-v2-after-add-user-to-a-room')).to.be.equal(true);
			expect(remove.getCall(4).calledWith('federation.afterCreateFederatedRoom', 'federation-v2-after-create-room')).to.be.equal(true);
			expect(remove.getCall(5).calledWith('federation.beforeAddUserToARoom', 'federation-v2-before-add-user-to-the-room')).to.be.equal(
				true,
			);
		});
	});
});
