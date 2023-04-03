import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { RoomMemberActions, RoomSettingsEnum } from '../../../../definition/IRoomTypeConfig';

const findOneByRoomIdAndUserIdStub = sinon.stub();

const { Federation } = proxyquire.noCallThru().load('../../../../server/services/federation/Federation', {
	'@rocket.chat/models': {
		Subscriptions: {
			findOneByRoomIdAndUserId: findOneByRoomIdAndUserIdStub,
		},
	},
});

describe('Federation[Server] - Federation', () => {
	afterEach(() => findOneByRoomIdAndUserIdStub.reset());

	describe('#actionAllowed()', () => {
		it('should return false if the room is NOT federated', async () => {
			await expect(Federation.actionAllowed({ t: 'c' } as any, RoomMemberActions.INVITE)).to.eventually.be.false;
		});

		it('should return false if the room is a DM one', async () => {
			await expect(Federation.actionAllowed({ t: 'd', federated: true } as any, RoomMemberActions.INVITE)).to.eventually.be.false;
		});

		it('should return true if an userId was not provided', async () => {
			await expect(Federation.actionAllowed({ t: 'c', federated: true } as any, RoomMemberActions.INVITE)).to.eventually.be.true;
		});

		it('should return true if there is no subscription for the userId', async () => {
			findOneByRoomIdAndUserIdStub.returns(undefined);
			await expect(Federation.actionAllowed({ t: 'c', federated: true } as any, RoomMemberActions.INVITE, 'userId')).to.eventually.be.true;
		});

		it('should return true if the action is equal to Leave (since any user can leave a channel)', async () => {
			findOneByRoomIdAndUserIdStub.returns({});
			await expect(Federation.actionAllowed({ t: 'c', federated: true } as any, RoomMemberActions.LEAVE, 'userId')).to.eventually.be.true;
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
				it('should return false if the action is NOT allowed within the federation context for regular channels', async () => {
					findOneByRoomIdAndUserIdStub.returns({});
					await expect(Federation.actionAllowed({ t: 'c', federated: true } as any, action, 'userId')).to.eventually.be.false;
				});
			});

		allowedActions.forEach((action) => {
			it('should return true if the action is allowed within the federation context for regular channels and the user is a room owner', async () => {
				findOneByRoomIdAndUserIdStub.returns({ roles: ['owner'] });
				await expect(Federation.actionAllowed({ t: 'c', federated: true } as any, action, 'userId')).to.eventually.be.true;
			});
		});

		const allowedActionsForModerators = allowedActions.filter((action) => action !== RoomMemberActions.SET_AS_OWNER);
		allowedActionsForModerators.forEach((action) => {
			it('should return true if the action is allowed within the federation context for regular channels and the user is a room moderator', async () => {
				findOneByRoomIdAndUserIdStub.returns({ roles: ['moderator'] });
				await expect(Federation.actionAllowed({ t: 'c', federated: true } as any, action, 'userId')).to.eventually.be.true;
			});
		});
		it('should return false if the action is equal to set owner and the user is a room moderator', async () => {
			findOneByRoomIdAndUserIdStub.returns({ roles: ['moderator'] });
			await expect(Federation.actionAllowed({ t: 'c', federated: true } as any, RoomMemberActions.SET_AS_OWNER, 'userId')).to.eventually.be
				.false;
		});

		const disallowedActionForRegularUsers = allowedActions.filter((action) => action !== RoomMemberActions.LEAVE);
		disallowedActionForRegularUsers.forEach((action) => {
			it('should return false if the for all other actions (excluding LEAVE) for regular users', async () => {
				findOneByRoomIdAndUserIdStub.returns({});
				await expect(Federation.actionAllowed({ t: 'c', federated: true } as any, action, 'userId')).to.eventually.be.false;
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

	describe('#isRoomSettingAllowed()', () => {
		it('should return false if the room is NOT federated', () => {
			expect(Federation.isRoomSettingAllowed({ t: 'c' } as any, RoomSettingsEnum.NAME)).to.be.false;
		});

		it('should return false if the room is a DM one', () => {
			expect(Federation.isRoomSettingAllowed({ t: 'd', federated: true } as any, RoomSettingsEnum.NAME)).to.be.false;
		});

		const allowedSettingsChanges = [RoomSettingsEnum.NAME, RoomSettingsEnum.TOPIC];

		Object.values(RoomSettingsEnum)
			.filter((setting) => !allowedSettingsChanges.includes(setting as any))
			.forEach((setting) => {
				it('should return false if the setting change is NOT allowed within the federation context for regular channels', () => {
					expect(Federation.isRoomSettingAllowed({ t: 'c', federated: true } as any, setting)).to.be.false;
				});
			});

		allowedSettingsChanges.forEach((setting) => {
			it('should return true if the setting change is allowed within the federation context for regular channels', () => {
				expect(Federation.isRoomSettingAllowed({ t: 'c', federated: true } as any, setting)).to.be.true;
			});
		});
	});
});
