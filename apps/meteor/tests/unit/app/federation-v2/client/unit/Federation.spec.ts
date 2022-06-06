import { expect } from 'chai';

import { Federation } from '../../../../../../app/federation-v2/client/Federation';
import { RoomMemberActions } from '../../../../../../definition/IRoomTypeConfig';

describe('Federation[Client] - Federation', () => {
	describe('#isAFederatedRoom()', () => {
		it('should return true if the room is federated', () => {
			expect(Federation.isAFederatedRoom({ federated: true } as any)).to.be.true;
		});

		it('should return false if the room is NOT federated', () => {
			expect(Federation.isAFederatedRoom({ federated: false } as any)).to.be.false;
		});

		it('should return false if the room does NOT have the federated property', () => {
			expect(Federation.isAFederatedRoom({} as any)).to.be.false;
		});
	});

	describe('#getMessageActionContextName()', () => {
		it('should return the name of the federation message action context', () => {
			expect(Federation.getMessageActionContextName()).to.be.equal('federated');
		});
	});

	describe('#federationActionAllowed()', () => {
		const allowedActions = [RoomMemberActions.REMOVE_USER];

		Object.values(RoomMemberActions)
			.filter((action) => !allowedActions.includes(action as any))
			.forEach((action) => {
				it('should return false if the action is NOT allowed within the federation context', () => {
					expect(Federation.federationActionAllowed(action)).to.be.false;
				});
			});

		allowedActions.forEach((action) => {
			it('should return true if the action is allowed within the federation context', () => {
				expect(Federation.federationActionAllowed(action)).to.be.true;
			});
		});
	});
});
