import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { RoomMemberActions } from '../../../../../../definition/IRoomTypeConfig';

const findOneByRoomIdAndUserIdStub = sinon.stub();

const { Federation } = proxyquire.noCallThru().load('../../../../../../app/federation-v2/server/Federation', {
	'@rocket.chat/models': {
		Subscriptions: {
			findOneByRoomIdAndUserId: findOneByRoomIdAndUserIdStub,
		},
	},
});

describe('Federation[Server] - Federation', () => {
	beforeEach(() => {
		Promise.await = (args) => args;
	});

	afterEach(() => findOneByRoomIdAndUserIdStub.reset());

	describe('#actionAllowed()', () => {
		it('should return false if the room is NOT federated', () => {
			expect(Federation.actionAllowed({ t: 'c' } as any, RoomMemberActions.INVITE)).to.be.false;
		});

		it('should return false if the room is a DM one', () => {
			expect(Federation.actionAllowed({ t: 'd', federated: true } as any, RoomMemberActions.INVITE)).to.be.false;
		});

		it('should return true if an userId was not provided', () => {
			expect(Federation.actionAllowed({ t: 'c', federated: true } as any, RoomMemberActions.INVITE)).to.be.true;
		});

		it('should return true if the user is the room creator', () => {
			expect(Federation.actionAllowed({ t: 'c', federated: true, u: { _id: 'userId' } } as any, RoomMemberActions.INVITE, 'userId')).to.be
				.true;
		});

		it('should return true if there is no subscription for the userId', () => {
			findOneByRoomIdAndUserIdStub.returns(undefined);
			expect(Federation.actionAllowed({ t: 'c', federated: true } as any, RoomMemberActions.INVITE, 'userId')).to.be.true;
		});

		const allowedActions = [
			RoomMemberActions.REMOVE_USER,
			RoomMemberActions.SET_AS_OWNER,
			RoomMemberActions.SET_AS_MODERATOR,
			RoomMemberActions.INVITE,
			RoomMemberActions.JOIN,
			RoomMemberActions.LEAVE,
		];

		Object.values(RoomMemberActions)
			.filter((action) => !allowedActions.includes(action as any))
			.forEach((action) => {
				it('should return false if the action is NOT allowed within the federation context for regular channels', () => {
					findOneByRoomIdAndUserIdStub.returns({});
					expect(Federation.actionAllowed({ t: 'c', federated: true } as any, action, 'userId')).to.be.false;
				});
			});

		allowedActions.forEach((action) => {
			it('should return true if the action is allowed within the federation context for regular channels and the user is a room owner', () => {
				findOneByRoomIdAndUserIdStub.returns({ roles: ['owner'] });
				expect(Federation.actionAllowed({ t: 'c', federated: true } as any, action, 'userId')).to.be.true;
			});
			it('should return true if the action is allowed within the federation context for regular channels and the user is a room moderator', () => {
				findOneByRoomIdAndUserIdStub.returns({ roles: ['moderator'] });
				expect(Federation.actionAllowed({ t: 'c', federated: true } as any, action, 'userId')).to.be.true;
			});
			it('should return false if the action is allowed within the federation context for regular channels and the user is nor a moderator or owner', () => {
				findOneByRoomIdAndUserIdStub.returns({});
				expect(Federation.actionAllowed({ t: 'c', federated: true } as any, action, 'userId')).to.be.false;
			});
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

	describe('#escapeExternalFederationId()', () => {
		it('should replace all "$" with "__sign__"', () => {
			expect(Federation.escapeExternalFederationEventId('$stri$ng')).to.be.equal('__sign__stri__sign__ng');
		});
	});

	describe('#unescapeExternalFederationEventId()', () => {
		it('should replace all "__sign__" with "$"', () => {
			expect(Federation.unescapeExternalFederationEventId('__sign__stri__sign__ng')).to.be.equal('$stri$ng');
		});
	});
});
