import type { IRoom, ISubscription, IUser, ValueOf } from '@rocket.chat/core-typings';

import * as Federation from './Federation';
import { RoomMemberActions, RoomSettingsEnum } from '../../../definition/IRoomTypeConfig';
import { queryClient } from '../queryClient';
import { roomsQueryKeys } from '../queryKeys';

afterEach(() => {
	queryClient.resetQueries();
});

describe('#actionAllowed()', () => {
	const me = 'user-id';
	const them = 'other-user-id';

	it('should return false if the room is not federated', () => {
		expect(
			Federation.actionAllowed({ federated: false }, RoomMemberActions.REMOVE_USER, 'user-id', { roles: ['owner'] } as ISubscription),
		).toBe(false);
	});

	it('should return false if the room is a direct message', () => {
		expect(
			Federation.actionAllowed({ federated: true, t: 'd' }, RoomMemberActions.REMOVE_USER, 'user-id', {
				roles: ['owner'],
			} as ISubscription),
		).toBe(false);
	});

	it('should return false if the user is not subscribed to the room', () => {
		expect(Federation.actionAllowed({ federated: true }, RoomMemberActions.REMOVE_USER, 'user-id', undefined)).toBe(false);
	});

	it('should return false if the user is trying to remove himself', () => {
		expect(
			Federation.actionAllowed({ federated: true }, RoomMemberActions.REMOVE_USER, 'user-id', {
				u: { _id: 'user-id' },
				roles: ['owner'],
			} as ISubscription),
		).toBe(false);
	});

	describe('Owners', () => {
		const myRole = ['owner'];

		describe('Seeing another owners', () => {
			const theirRole = ['owner'];

			beforeEach(() => {
				queryClient.setQueryData(roomsQueryKeys.roles('room-id'), [
					{ rid: 'room-id', u: { _id: me }, roles: myRole },
					{ rid: 'room-id', u: { _id: them }, roles: theirRole },
				]);
			});

			it('should return true if the user want to remove himself as an owner', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_OWNER, me, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(true);
			});

			it('should return true if the user want to add himself as a moderator (Demoting himself to moderator)', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_MODERATOR, me, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(true);
			});

			it('should return false if the user want to remove another owners as an owner', () => {
				queryClient.setQueryData(roomsQueryKeys.roles('room-id'), [
					{ rid: 'room-id', u: { _id: me }, roles: myRole },
					{ rid: 'room-id', u: { _id: them }, roles: theirRole },
				]);
				expect(
					Federation.actionAllowed({ _id: 'room-id', federated: true }, RoomMemberActions.SET_AS_OWNER, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(false);
			});

			it('should return false if the user want to remove another owners from the room', () => {
				expect(
					Federation.actionAllowed({ _id: 'room-id', federated: true }, RoomMemberActions.REMOVE_USER, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(false);
			});
		});

		describe('Seeing moderators', () => {
			const theirRole = ['moderator'];

			beforeEach(() => {
				queryClient.setQueryData(roomsQueryKeys.roles('room-id'), [
					{ rid: 'room-id', u: { _id: me }, roles: myRole },
					{ rid: 'room-id', u: { _id: them }, roles: theirRole },
				]);
			});

			it('should return true if the user want to add/remove moderators as an owner', () => {
				expect(
					Federation.actionAllowed({ _id: 'room-id', federated: true }, RoomMemberActions.SET_AS_OWNER, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(true);
			});

			it('should return true if the user want to remove moderators as a moderator', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_MODERATOR, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(true);
			});

			it('should return true if the user want to remove moderators from the room', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.REMOVE_USER, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(true);
			});
		});

		describe('Seeing normal users', () => {
			it('should return true if the user want to add/remove normal users as an owner', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_OWNER, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(true);
			});

			it('should return true if the user want to add/remove normal users as a moderator', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_MODERATOR, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(true);
			});

			it('should return true if the user want to remove normal users from the room', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.REMOVE_USER, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(true);
			});
		});
	});

	describe('Moderators', () => {
		const myRole = ['moderator'];

		describe('Seeing owners', () => {
			const theirRole = ['owner'];

			beforeEach(() => {
				queryClient.setQueryData(roomsQueryKeys.roles('room-id'), [
					{ rid: 'room-id', u: { _id: me }, roles: myRole },
					{ rid: 'room-id', u: { _id: them }, roles: theirRole },
				]);
			});

			it('should return false if the user want to add/remove owners as a moderator', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_OWNER, me, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(false);
			});

			it('should return false if the user want to add/remove owners as a moderator', () => {
				expect(
					Federation.actionAllowed({ _id: 'room-id', federated: true }, RoomMemberActions.SET_AS_MODERATOR, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(false);
			});

			it('should return false if the user want to add/remove owners as a moderator', () => {
				expect(
					Federation.actionAllowed({ _id: 'room-id', federated: true }, RoomMemberActions.SET_AS_MODERATOR, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(false);
			});

			it('should return false if the user want to remove owners from the room', () => {
				expect(
					Federation.actionAllowed({ _id: 'room-id', federated: true }, RoomMemberActions.REMOVE_USER, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(false);
			});
		});

		describe('Seeing another moderators', () => {
			const theirRole = ['moderator'];

			beforeEach(() => {
				queryClient.setQueryData(roomsQueryKeys.roles('room-id'), [
					{ rid: 'room-id', u: { _id: me }, roles: myRole },
					{ rid: 'room-id', u: { _id: them }, roles: theirRole },
				]);
			});

			it('should return false if the user want to add/remove moderator as an owner', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_OWNER, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(false);
			});

			it('should return true if the user want to remove himself as a moderator (Demoting himself)', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_MODERATOR, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(true);
			});

			it('should return false if the user want to promote himself as an owner', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_OWNER, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(false);
			});

			it('should return false if the user want to remove another moderator from their role', () => {
				expect(
					Federation.actionAllowed({ _id: 'room-id', federated: true }, RoomMemberActions.SET_AS_MODERATOR, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(false);
			});

			it('should return false if the user want to remove another moderator from the room', () => {
				expect(
					Federation.actionAllowed({ _id: 'room-id', federated: true }, RoomMemberActions.REMOVE_USER, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(false);
			});
		});

		describe('Seeing normal users', () => {
			it('should return false if the user want to add/remove normal users as an owner', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_OWNER, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(false);
			});

			it('should return true if the user want to add/remove normal users as a moderator', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_MODERATOR, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(true);
			});

			it('should return true if the user want to remove normal users from the room', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.REMOVE_USER, them, {
						u: { _id: me },
						roles: myRole,
					} as ISubscription),
				).toBe(true);
			});
		});
	});

	describe('Normal user', () => {
		describe('Seeing owners', () => {
			const theirRole = ['owner'];

			beforeEach(() => {
				queryClient.setQueryData(roomsQueryKeys.roles('room-id'), [{ rid: 'room-id', u: { _id: them }, roles: theirRole }]);
			});

			it('should return false if the user want to add/remove owners as a normal user', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_OWNER, them, {
						u: { _id: me },
					} as ISubscription),
				).toBe(false);
			});

			it('should return false if the user want to add/remove moderators as a normal user', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_MODERATOR, them, {
						u: { _id: me },
					} as ISubscription),
				).toBe(false);
			});

			it('should return false if the user want to remove owners from the room', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.REMOVE_USER, them, {
						u: { _id: me },
					} as ISubscription),
				).toBe(false);
			});
		});

		describe('Seeing moderators', () => {
			const theirRole = ['owner'];

			beforeEach(() => {
				queryClient.setQueryData(roomsQueryKeys.roles('room-id'), [{ rid: 'room-id', u: { _id: them }, roles: theirRole }]);
			});

			it('should return false if the user want to add/remove owner as a normal user', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_OWNER, them, {
						u: { _id: me },
					} as ISubscription),
				).toBe(false);
			});

			it('should return false if the user want to remove a moderator from their role', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_MODERATOR, them, {
						u: { _id: me },
					} as ISubscription),
				).toBe(false);
			});

			it('should return false if the user want to remove a moderator from the room', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.REMOVE_USER, them, {
						u: { _id: me },
					} as ISubscription),
				).toBe(false);
			});
		});

		describe('Seeing another normal users', () => {
			it('should return false if the user want to add/remove owner as a normal user', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_OWNER, them, {
						u: { _id: me },
					} as ISubscription),
				).toBe(false);
			});

			it('should return false if the user want to add/remove moderator as a normal user', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.SET_AS_OWNER, them, {
						u: { _id: me },
					} as ISubscription),
				).toBe(false);
			});

			it('should return false if the user want to remove normal users from the room', () => {
				expect(
					Federation.actionAllowed({ federated: true }, RoomMemberActions.REMOVE_USER, them, {
						u: { _id: me },
					} as ISubscription),
				).toBe(false);
			});

			it.each([[RoomMemberActions.SET_AS_MODERATOR], [RoomMemberActions.SET_AS_OWNER], [RoomMemberActions.REMOVE_USER]])(
				'should return false if the user want to %s for himself',
				(action) => {
					expect(
						Federation.actionAllowed({ federated: true }, action, me, {
							u: { _id: me },
						} as ISubscription),
					).toBe(false);
				},
			);
		});
	});
});

describe('#isEditableByTheUser()', () => {
	it('should return false if the user is null', () => {
		expect(Federation.isEditableByTheUser(undefined, { u: { _id: 'id' } } as IRoom, {} as ISubscription)).toBe(false);
	});

	it('should return false if the room is null', () => {
		expect(Federation.isEditableByTheUser({} as IUser, undefined, {} as ISubscription)).toBe(false);
	});

	it('should return false if the subscription is null', () => {
		expect(Federation.isEditableByTheUser({} as IUser, {} as IRoom, undefined)).toBe(false);
	});

	it('should return false if the current room is NOT a federated one', () => {
		expect(Federation.isEditableByTheUser({ _id: 'differentId' } as IUser, { u: { _id: 'id' } } as IRoom, {} as ISubscription)).toBe(false);
	});

	it('should return false if the current user is NOT the room owner nor moderator', () => {
		expect(
			Federation.isEditableByTheUser({ _id: 'differentId' } as IUser, { federated: true, u: { _id: 'id' } } as IRoom, {} as ISubscription),
		).toBe(false);
	});

	it('should return true if the current user is a room owner', () => {
		expect(
			Federation.isEditableByTheUser(
				{ _id: 'differentId' } as IUser,
				{ federated: true, u: { _id: 'id' } } as IRoom,
				{ roles: ['owner'] } as ISubscription,
			),
		).toBe(true);
	});

	it('should return true if the current user is a room moderator', () => {
		expect(
			Federation.isEditableByTheUser(
				{ _id: 'differentId' } as IUser,
				{ federated: true, u: { _id: 'id' } } as IRoom,
				{ roles: ['moderator'] } as ISubscription,
			),
		).toBe(true);
	});
});

describe('#canCreateInviteLinks()', () => {
	it('should return false if the user is null', () => {
		expect(Federation.canCreateInviteLinks(undefined, { u: { _id: 'id' } } as IRoom, {} as ISubscription)).toBe(false);
	});

	it('should return false if the room is null', () => {
		expect(Federation.canCreateInviteLinks({} as IUser, undefined, {} as ISubscription)).toBe(false);
	});

	it('should return false if the subscription is null', () => {
		expect(Federation.canCreateInviteLinks({} as IUser, {} as IRoom, undefined)).toBe(false);
	});

	it('should return false if the current room is NOT a federated one', () => {
		expect(Federation.canCreateInviteLinks({ _id: 'differentId' } as IUser, { u: { _id: 'id' } } as IRoom, {} as ISubscription)).toBe(
			false,
		);
	});

	it('should return false if the current room is federated one but NOT a public one', () => {
		expect(
			Federation.canCreateInviteLinks({ _id: 'differentId' } as IUser, { federated: true, u: { _id: 'id' } } as IRoom, {} as ISubscription),
		).toBe(false);
	});

	it('should return false if the current room is federated one, a public one but the user is NOT an owner nor moderator', () => {
		expect(
			Federation.canCreateInviteLinks(
				{ _id: 'differentId' } as IUser,
				{ federated: true, t: 'c', u: { _id: 'id' } } as IRoom,
				{} as ISubscription,
			),
		).toBe(false);
	});

	it('should return false if the current room is federated one, a public one but the user is NOT an owner nor moderator', () => {
		expect(
			Federation.canCreateInviteLinks(
				{ _id: 'differentId' } as IUser,
				{ federated: true, t: 'c', u: { _id: 'id' } } as IRoom,
				{} as ISubscription,
			),
		).toBe(false);
	});

	it('should return true if the current room is federated one, a public one but the user is an owner', () => {
		expect(
			Federation.canCreateInviteLinks(
				{ _id: 'differentId' } as IUser,
				{ federated: true, t: 'c', u: { _id: 'id' } } as IRoom,
				{ roles: ['owner'] } as ISubscription,
			),
		).toBe(true);
	});

	it('should return true if the current room is federated one, a public one but the user is an moderator', () => {
		expect(
			Federation.canCreateInviteLinks(
				{ _id: 'differentId' } as IUser,
				{ federated: true, t: 'c', u: { _id: 'id' } } as IRoom,
				{ roles: ['moderator'] } as ISubscription,
			),
		).toBe(true);
	});
});

describe('#isRoomSettingAllowed()', () => {
	it('should return false if the room is NOT federated', () => {
		expect(Federation.isRoomSettingAllowed({ t: 'c' }, RoomSettingsEnum.NAME)).toBe(false);
	});

	it('should return false if the room is a DM one', () => {
		expect(Federation.isRoomSettingAllowed({ t: 'd', federated: true }, RoomSettingsEnum.NAME)).toBe(false);
	});

	const allowedSettingsChanges: ValueOf<typeof RoomSettingsEnum>[] = [RoomSettingsEnum.NAME, RoomSettingsEnum.TOPIC];

	Object.values(RoomSettingsEnum)
		.filter((setting) => !allowedSettingsChanges.includes(setting))
		.forEach((setting) => {
			it('should return false if the setting change is NOT allowed within the federation context for regular channels', () => {
				expect(Federation.isRoomSettingAllowed({ t: 'c', federated: true }, setting)).toBe(false);
			});
		});

	allowedSettingsChanges.forEach((setting) => {
		it('should return true if the setting change is allowed within the federation context for regular channels', () => {
			expect(Federation.isRoomSettingAllowed({ t: 'c', federated: true }, setting)).toBe(true);
		});
	});
});
