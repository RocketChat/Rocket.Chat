import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { RoomMemberActions, RoomSettingsEnum } from '../../../../../definition/IRoomTypeConfig';

const findOneStub = sinon.stub();

const Federation = proxyquire.noCallThru().load('../../../../../client/lib/federation/Federation', {
	'../../../app/models/client': {
		RoomRoles: {
			findOne: findOneStub,
		},
	},
});

describe('Federation[Client] - Federation', () => {
	afterEach(() => findOneStub.reset());

	describe('#actionAllowed()', () => {
		const me = 'user-id';
		const them = 'other-user-id';

		it('should return false if the room is not federated', () => {
			expect(Federation.actionAllowed({ federated: false } as any, RoomMemberActions.REMOVE_USER, 'user-id', { roles: ['owner'] } as any))
				.to.be.false;
		});

		it('should return false if the room is a direct message', () => {
			expect(
				Federation.actionAllowed({ federated: true, t: 'd' } as any, RoomMemberActions.REMOVE_USER, 'user-id', { roles: ['owner'] } as any),
			).to.be.false;
		});

		it('should return false if the user is not subscribed to the room', () => {
			expect(Federation.actionAllowed({ federated: true } as any, RoomMemberActions.REMOVE_USER, 'user-id', undefined)).to.be.false;
		});

		it('should return false if the user is trying to remove himself', () => {
			expect(
				Federation.actionAllowed({ federated: true } as any, RoomMemberActions.REMOVE_USER, 'user-id', {
					u: { _id: 'user-id' },
					roles: ['owner'],
				} as any),
			).to.be.false;
		});

		describe('Owners', () => {
			const myRole = ['owner'];

			describe('Seeing another owners', () => {
				const theirRole = ['owner'];
				it('should return true if the user want to remove himself as an owner', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_OWNER, me, {
							u: { _id: me },
							roles: myRole,
						} as any),
					).to.be.true;
				});
				it('should return true if the user want to add himself as a moderator (Demoting himself to moderator)', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_MODERATOR, me, {
							u: { _id: me },
							roles: myRole,
						} as any),
					).to.be.true;
				});
				it('should return false if the user want to remove another owners as an owner', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_OWNER, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.false;
				});
				it('should return false if the user want to remove another owners from the room', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.REMOVE_USER, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.false;
				});
			});
			describe('Seeing moderators', () => {
				const theirRole = ['moderator'];

				it('should return true if the user want to add/remove moderators as an owner', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_OWNER, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.true;
				});
				it('should return true if the user want to remove moderators as a moderator', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_MODERATOR, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.true;
				});
				it('should return true if the user want to remove moderators from the room', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.REMOVE_USER, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.true;
				});
			});
			describe('Seeing normal users', () => {
				it('should return true if the user want to add/remove normal users as an owner', () => {
					findOneStub.returns(undefined);
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_OWNER, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.true;
				});
				it('should return true if the user want to add/remove normal users as a moderator', () => {
					findOneStub.returns(undefined);
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_MODERATOR, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.true;
				});
				it('should return true if the user want to remove normal users from the room', () => {
					findOneStub.returns(undefined);
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.REMOVE_USER, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.true;
				});
			});
		});

		describe('Moderators', () => {
			const myRole = ['moderator'];
			describe('Seeing owners', () => {
				const theirRole = ['owner'];
				it('should return false if the user want to add/remove owners as a moderator', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_OWNER, me, {
							u: { _id: me },
							roles: myRole,
						} as any),
					).to.be.false;
				});
				it('should return false if the user want to add/remove owners as a moderator', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_MODERATOR, me, {
							u: { _id: me },
							roles: myRole,
						} as any),
					).to.be.false;
				});
				it('should return false if the user want to add/remove owners as a moderator', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_MODERATOR, me, {
							u: { _id: me },
							roles: myRole,
						} as any),
					).to.be.false;
				});
				it('should return false if the user want to remove owners from the room', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.REMOVE_USER, me, {
							u: { _id: me },
							roles: myRole,
						} as any),
					).to.be.false;
				});
			});
			describe('Seeing another moderators', () => {
				const theirRole = ['moderator'];
				it('should return false if the user want to add/remove moderator as an owner', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_OWNER, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.false;
				});
				it('should return true if the user want to remove himself as a moderator (Demoting himself)', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_MODERATOR, me, {
							u: { _id: me },
							roles: myRole,
						} as any),
					).to.be.true;
				});
				it('should return false if the user want to promote himself as an owner', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_OWNER, me, {
							u: { _id: me },
							roles: myRole,
						} as any),
					).to.be.false;
				});
				it('should return false if the user want to remove another moderator from their role', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_MODERATOR, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.false;
				});
				it('should return false if the user want to remove another moderator from the room', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.REMOVE_USER, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.false;
				});
			});
			describe('Seeing normal users', () => {
				it('should return false if the user want to add/remove normal users as an owner', () => {
					findOneStub.returns(undefined);
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_OWNER, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.false;
				});
				it('should return true if the user want to add/remove normal users as a moderator', () => {
					findOneStub.returns(undefined);
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_MODERATOR, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.true;
				});
				it('should return true if the user want to remove normal users from the room', () => {
					findOneStub.returns(undefined);
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.REMOVE_USER, me, {
							u: { _id: them },
							roles: myRole,
						} as any),
					).to.be.true;
				});
			});
		});

		describe('Normal user', () => {
			describe('Seeing owners', () => {
				const theirRole = ['owner'];
				it('should return false if the user want to add/remove owners as a normal user', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_OWNER, me, {
							u: { _id: them },
						} as any),
					).to.be.false;
				});
				it('should return false if the user want to add/remove moderators as a normal user', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_MODERATOR, me, {
							u: { _id: them },
						} as any),
					).to.be.false;
				});
				it('should return false if the user want to remove owners from the room', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.REMOVE_USER, me, {
							u: { _id: them },
						} as any),
					).to.be.false;
				});
			});
			describe('Seeing moderators', () => {
				const theirRole = ['owner'];
				it('should return false if the user want to add/remove owner as a normal user', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_OWNER, me, {
							u: { _id: them },
						} as any),
					).to.be.false;
				});
				it('should return false if the user want to remove a moderator from their role', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_MODERATOR, me, {
							u: { _id: them },
						} as any),
					).to.be.false;
				});
				it('should return false if the user want to remove a moderator from the room', () => {
					findOneStub.returns({ roles: theirRole });
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.REMOVE_USER, me, {
							u: { _id: them },
						} as any),
					).to.be.false;
				});
			});
			describe('Seeing another normal users', () => {
				it('should return false if the user want to add/remove owner as a normal user', () => {
					findOneStub.returns(undefined);
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_OWNER, me, {
							u: { _id: them },
						} as any),
					).to.be.false;
				});
				it('should return false if the user want to add/remove moderator as a normal user', () => {
					findOneStub.returns(undefined);
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.SET_AS_OWNER, me, {
							u: { _id: them },
						} as any),
					).to.be.false;
				});
				it('should return false if the user want to remove normal users from the room', () => {
					findOneStub.returns(undefined);
					expect(
						Federation.actionAllowed({ federated: true } as any, RoomMemberActions.REMOVE_USER, me, {
							u: { _id: them },
						} as any),
					).to.be.false;
				});

				[RoomMemberActions.SET_AS_MODERATOR, RoomMemberActions.SET_AS_OWNER, RoomMemberActions.REMOVE_USER].forEach((action) => {
					it(`should return false if the user want to ${action} for himself`, () => {
						findOneStub.returns(undefined);
						expect(
							Federation.actionAllowed({ federated: true } as any, action, me, {
								u: { _id: me },
							} as any),
						).to.be.false;
					});
				});
			});
		});
	});

	describe('#isEditableByTheUser()', () => {
		it('should return false if the user is null', () => {
			expect(Federation.isEditableByTheUser(undefined, { u: { _id: 'id' } } as any, {} as any)).to.be.false;
		});

		it('should return false if the room is null', () => {
			expect(Federation.isEditableByTheUser({} as any, undefined, {} as any)).to.be.false;
		});

		it('should return false if the subscription is null', () => {
			expect(Federation.isEditableByTheUser({} as any, {} as any, undefined)).to.be.false;
		});

		it('should return false if the current room is NOT a federated one', () => {
			expect(Federation.isEditableByTheUser({ _id: 'differentId' } as any, { u: { _id: 'id' } } as any, {} as any)).to.be.false;
		});

		it('should return false if the current user is NOT the room owner nor moderator', () => {
			expect(Federation.isEditableByTheUser({ _id: 'differentId' } as any, { federated: true, u: { _id: 'id' } } as any, {} as any)).to.be
				.false;
		});

		it('should return true if the current user is a room owner', () => {
			expect(
				Federation.isEditableByTheUser(
					{ _id: 'differentId' } as any,
					{ federated: true, u: { _id: 'id' } } as any,
					{ roles: ['owner'] } as any,
				),
			).to.be.true;
		});

		it('should return true if the current user is a room moderator', () => {
			expect(
				Federation.isEditableByTheUser(
					{ _id: 'differentId' } as any,
					{ federated: true, u: { _id: 'id' } } as any,
					{ roles: ['moderator'] } as any,
				),
			).to.be.true;
		});
	});
	describe('#canCreateInviteLinks()', () => {
		it('should return false if the user is null', () => {
			expect(Federation.canCreateInviteLinks(undefined, { u: { _id: 'id' } } as any, {} as any)).to.be.false;
		});

		it('should return false if the room is null', () => {
			expect(Federation.canCreateInviteLinks({} as any, undefined, {} as any)).to.be.false;
		});

		it('should return false if the subscription is null', () => {
			expect(Federation.canCreateInviteLinks({} as any, {} as any, undefined)).to.be.false;
		});

		it('should return false if the current room is NOT a federated one', () => {
			expect(Federation.canCreateInviteLinks({ _id: 'differentId' } as any, { u: { _id: 'id' } } as any, {} as any)).to.be.false;
		});

		it('should return false if the current room is federated one but NOT a public one', () => {
			expect(Federation.canCreateInviteLinks({ _id: 'differentId' } as any, { federated: true, u: { _id: 'id' } } as any, {} as any)).to.be
				.false;
		});

		it('should return false if the current room is federated one, a public one but the user is NOT an owner nor moderator', () => {
			expect(
				Federation.canCreateInviteLinks({ _id: 'differentId' } as any, { federated: true, t: 'c', u: { _id: 'id' } } as any, {} as any),
			).to.be.false;
		});

		it('should return false if the current room is federated one, a public one but the user is NOT an owner nor moderator', () => {
			expect(
				Federation.canCreateInviteLinks({ _id: 'differentId' } as any, { federated: true, t: 'c', u: { _id: 'id' } } as any, {} as any),
			).to.be.false;
		});

		it('should return true if the current room is federated one, a public one but the user is an owner', () => {
			expect(
				Federation.canCreateInviteLinks(
					{ _id: 'differentId' } as any,
					{ federated: true, t: 'c', u: { _id: 'id' } } as any,
					{ roles: ['owner'] } as any,
				),
			).to.be.true;
		});

		it('should return true if the current room is federated one, a public one but the user is an moderator', () => {
			expect(
				Federation.canCreateInviteLinks(
					{ _id: 'differentId' } as any,
					{ federated: true, t: 'c', u: { _id: 'id' } } as any,
					{ roles: ['moderator'] } as any,
				),
			).to.be.true;
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
