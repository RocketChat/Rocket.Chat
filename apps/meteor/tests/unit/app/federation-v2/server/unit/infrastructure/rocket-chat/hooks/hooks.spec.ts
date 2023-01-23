/* eslint-disable */
import proxyquire from 'proxyquire';
import { expect } from 'chai';
import sinon from 'sinon';

const remove = sinon.stub();
const get = sinon.stub();

const { FederationHooks } = proxyquire
	.noCallThru()
	.load('../../../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/hooks', {
		'meteor/meteor': {
			'@global': true,
		},
		'meteor/random': {
			'@global': true,
		},
		'../../../../../../lib/callbacks': {
			callbacks: {
				remove,
			},
		},
		'../../../../../settings/server': {
			settings: {
				get,
			},
		},
	});

describe('Federation - Infrastructure - RocketChat - Hooks', () => {
	beforeEach(() => {
		Promise.await = (args) => args;
	});

	afterEach(() => {
		remove.reset();
		get.reset();
	});

	describe('#afterRoomRoleChanged', () => {
		const handlers: any = {
			onRoomOwnerAdded: sinon.stub(),
			onRoomOwnerRemoved: sinon.stub(),
			onRoomModeratorAdded: sinon.stub(),
			onRoomModeratorRemoved: sinon.stub(),
		};

		afterEach(() => {
			handlers.onRoomOwnerAdded.reset();
			handlers.onRoomOwnerRemoved.reset();
			handlers.onRoomModeratorAdded.reset();
			handlers.onRoomModeratorRemoved.reset();
		});

		it('should NOT call the handler if the event is empty', () => {
			FederationHooks.afterRoomRoleChanged(handlers, undefined);

			expect(handlers.onRoomOwnerAdded.called).to.be.false;
			expect(handlers.onRoomOwnerRemoved.called).to.be.false;
			expect(handlers.onRoomModeratorAdded.called).to.be.false;
			expect(handlers.onRoomModeratorRemoved.called).to.be.false;
		});

		it('should NOT call the Federation module is disabled', () => {
			get.returns(false);
			FederationHooks.afterRoomRoleChanged(handlers, undefined);

			expect(handlers.onRoomOwnerAdded.called).to.be.false;
			expect(handlers.onRoomOwnerRemoved.called).to.be.false;
			expect(handlers.onRoomModeratorAdded.called).to.be.false;
			expect(handlers.onRoomModeratorRemoved.called).to.be.false;
		});
		it('should NOT call the handler if the event is not for roles we are interested in on Federation', () => {
			get.returns(true);
			FederationHooks.afterRoomRoleChanged(handlers, { _id: 'not-interested' });

			expect(handlers.onRoomOwnerAdded.called).to.be.false;
			expect(handlers.onRoomOwnerRemoved.called).to.be.false;
			expect(handlers.onRoomModeratorAdded.called).to.be.false;
			expect(handlers.onRoomModeratorRemoved.called).to.be.false;
		});

		it('should NOT call the handler there is no handler for the event', () => {
			get.returns(true);
			FederationHooks.afterRoomRoleChanged(handlers, { _id: 'owner', type: 'not-existing-type' });

			expect(handlers.onRoomOwnerAdded.called).to.be.false;
			expect(handlers.onRoomOwnerRemoved.called).to.be.false;
			expect(handlers.onRoomModeratorAdded.called).to.be.false;
			expect(handlers.onRoomModeratorRemoved.called).to.be.false;
		});

		['owner-added', 'owner-removed', 'moderator-added', 'moderator-removed'].forEach((type) => {
			const internalRoomId = 'internalRoomId';
			const internalTargetUserId = 'internalTargetUserId';
			const internalUserId = 'internalUserId';
			it(`should call the handler for the event ${type}`, () => {
				get.returns(true);
				FederationHooks.afterRoomRoleChanged(handlers, {
					_id: type.split('-')[0],
					type: type.split('-')[1],
					scope: internalRoomId,
					u: { _id: internalTargetUserId },
					givenByUserId: internalUserId,
				});

				expect(
					handlers[`onRoom${type.charAt(0).toUpperCase() + type.slice(1).replace(/-./g, (x) => x[1].toUpperCase())}`].calledWith(
						internalUserId,
						internalTargetUserId,
						internalRoomId,
					),
				).to.be.true;
			});
		});

		it('should call the correct handler with the correct parameters', () => {});
	});

	describe('#removeCEValidation()', () => {
		it('should remove the specific validation for CE environments', () => {
			FederationHooks.removeCEValidation();
			expect(remove.calledTwice).to.be.equal(true);
			expect(
				remove.firstCall.calledWith('federation.beforeAddUserAToRoom', 'federation-v2-can-add-federated-user-to-federated-room'),
			).to.be.equal(true);
			expect(
				remove.secondCall.calledWith('federation.beforeCreateDirectMessage', 'federation-v2-can-create-direct-message-from-ui-ce'),
			).to.be.equal(true);
		});
	});
});
