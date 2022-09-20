import { expect } from 'chai';

import { Federation } from '../../../../../../app/federation-v2/server/Federation';
import { RoomMemberActions } from '../../../../../../definition/IRoomTypeConfig';

describe('Federation[Server] - Federation', () => {
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

	describe('#isAFederatedUsername()', () => {
		it('should return true if the username is a federated username (includes at least one "@" and at least one ":"', () => {
			expect(Federation.isAFederatedUsername('@user:domain.com')).to.be.true;
		});

		it('should return false if the username is a federated username (does NOT includes at least one "@" and at least one ":"', () => {
			expect(Federation.isAFederatedUsername('user:domain.com')).to.be.false;
		});
	});
});
