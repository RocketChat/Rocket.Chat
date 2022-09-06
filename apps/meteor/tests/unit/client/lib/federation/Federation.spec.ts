import { expect } from 'chai';

import * as Federation from '../../../../../client/lib/federation/Federation';
import { RoomMemberActions } from '../../../../../definition/IRoomTypeConfig';

describe('Federation[Client] - Federation', () => {
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

	describe('#isEditableByTheUser()', () => {
		it('should return false if the user is null', () => {
			expect(Federation.isEditableByTheUser(undefined, { u: { _id: 'id' } } as any)).to.be.false;
		});

		it('should return false if the room is null', () => {
			expect(Federation.isEditableByTheUser({} as any, undefined)).to.be.false;
		});

		it('should return true if current user is the room owner', () => {
			expect(Federation.isEditableByTheUser({ _id: 'id' } as any, { u: { _id: 'id' } } as any)).to.be.true;
		});

		it('should return false if current user is NOT the room owner', () => {
			expect(Federation.isEditableByTheUser({ _id: 'differentId' } as any, { u: { _id: 'id' } } as any)).to.be.false;
		});
	});
});
