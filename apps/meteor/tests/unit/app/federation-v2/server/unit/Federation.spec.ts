import { expect } from 'chai';

import { Federation } from '../../../../../../app/federation-v2/server/infrastructure/rocket-chat/Federation';
import { RoomMemberActions } from '../../../../../../definition/IRoomTypeConfig';

describe('Federation[Server] - Federation', () => {
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

	describe('#actionAllowed()', () => {
		const allowedActions = [RoomMemberActions.REMOVE_USER, RoomMemberActions.INVITE, RoomMemberActions.JOIN, RoomMemberActions.LEAVE];

		Object.values(RoomMemberActions)
			.filter((action) => !allowedActions.includes(action as any))
			.forEach((action) => {
				it('should return false if the action is NOT allowed within the federation context for regular channels', () => {
					expect(Federation.actionAllowed({ t: 'c' } as any, action)).to.be.false;
				});
			});

		allowedActions.forEach((action) => {
			it('should return true if the action is allowed within the federation context for regular channels', () => {
				expect(Federation.actionAllowed({ t: 'c' } as any, action)).to.be.true;
			});
		});

		it('should return false if the action is equal to REMOVE_USER and the channel is a DM', () => {
			expect(Federation.actionAllowed({ t: 'd' } as any, RoomMemberActions.REMOVE_USER)).to.be.false;
		});

		it('should return true if the action is equal to any other action except REMOVE_USER and the channel is a DM', () => {
			expect(Federation.actionAllowed({ t: 'd' } as any, RoomMemberActions.INVITE)).to.be.true;
		});
	});
});
