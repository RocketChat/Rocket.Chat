import { expect } from 'chai';

import * as Federation from '../../../../../../app/federation-v2/client/Federation';
import { RoomMemberActions } from '../../../../../../definition/IRoomTypeConfig';

describe('Federation[Client] - Federation', () => {
	describe('#actionAllowed()', () => {
		const allowedActions = [RoomMemberActions.REMOVE_USER, RoomMemberActions.INVITE, RoomMemberActions.JOIN, RoomMemberActions.LEAVE];

		Object.values(RoomMemberActions)
			.filter((action) => !allowedActions.includes(action as any))
			.forEach((action) => {
				it('should return false if the action is NOT allowed within the federation context', () => {
					expect(Federation.actionAllowed(action)).to.be.false;
				});
			});

		allowedActions.forEach((action) => {
			it('should return true if the action is allowed within the federation context', () => {
				expect(Federation.actionAllowed(action)).to.be.true;
			});
		});
	});
});
