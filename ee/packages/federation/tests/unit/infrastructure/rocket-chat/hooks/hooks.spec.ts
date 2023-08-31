import { expect } from 'chai';
import sinon from 'sinon';

import { FederationHooks } from '../../../../../src/infrastructure/rocket-chat/hooks';

describe('Federation - Infrastructure - RocketChat - Hooks', () => {
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

		it('should NOT call the handler if the event is not for roles we are interested in on Federation', () => {
			FederationHooks.afterRoomRoleChanged(handlers, { _id: 'not-interested' });

			expect(handlers.onRoomOwnerAdded.called).to.be.false;
			expect(handlers.onRoomOwnerRemoved.called).to.be.false;
			expect(handlers.onRoomModeratorAdded.called).to.be.false;
			expect(handlers.onRoomModeratorRemoved.called).to.be.false;
		});

		it('should NOT call the handler there is no handler for the event', () => {
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
	});
});
