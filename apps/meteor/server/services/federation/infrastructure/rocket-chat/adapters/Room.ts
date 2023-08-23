import { api, Message } from '@rocket.chat/core-services';
import type { IDirectMessageRoom, IRoom, IUser } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, MatrixBridgedRoom, Users } from '@rocket.chat/models';

import { saveRoomTopic } from '../../../../../../app/channel-settings/server';
import { addUserToRoom } from '../../../../../../app/lib/server/functions/addUserToRoom';
import { createRoom } from '../../../../../../app/lib/server/functions/createRoom';
import { removeUserFromRoom } from '../../../../../../app/lib/server/functions/removeUserFromRoom';
import { settings } from '../../../../../../app/settings/server';
import { getValidRoomName } from '../../../../../../app/utils/server/lib/getValidRoomName';
import { DirectMessageFederatedRoom, FederatedRoom } from '../../../domain/FederatedRoom';
import type { FederatedUser } from '../../../domain/FederatedUser';
import { extractServerNameFromExternalIdentifier } from '../../matrix/converters/room/RoomReceiver';
import type { ROCKET_CHAT_FEDERATION_ROLES } from '../definitions/FederatedRoomInternalRoles';
import { getFederatedUserByInternalUsername } from './User';

type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
	[Property in Key]-?: Type[Property];
};

export class RocketChatRoomAdapter {
	public async getFederatedRoomByExternalId(externalRoomId: string): Promise<FederatedRoom | undefined> {
		const internalBridgedRoomId = await MatrixBridgedRoom.getLocalRoomId(externalRoomId);
		if (!internalBridgedRoomId) {
			return;
		}
		const room = await Rooms.findOneById(internalBridgedRoomId);
		if (room) {
			return this.createFederatedRoomInstance(externalRoomId, room);
		}
	}

	public async getFederatedRoomByInternalId(internalRoomId: string): Promise<FederatedRoom | undefined> {
		const externalRoomId = await MatrixBridgedRoom.getExternalRoomId(internalRoomId);
		if (!externalRoomId) {
			return;
		}
		const room = await Rooms.findOneById(internalRoomId);

		if (room) {
			return this.createFederatedRoomInstance(externalRoomId, room);
		}
	}

	public async getInternalRoomById(internalRoomId: string): Promise<IRoom | null> {
		return Rooms.findOneById(internalRoomId);
	}

	public async createFederatedRoom(federatedRoom: FederatedRoom): Promise<string> {
		const usernameOrId = federatedRoom.getCreatorUsername() || federatedRoom.getCreatorId();
		if (!usernameOrId) {
			throw new Error('Cannot create a room without a creator');
		}
		const roomName = await getValidRoomName(
			(federatedRoom.getDisplayName() || '')
				.replace(/[^a-zA-Z0-9 ]/g, '')
				.trim()
				.replace(/ /g, '-'),
		);
		const { rid, _id } = await createRoom(federatedRoom.getRoomType(), roomName, usernameOrId);
		const roomId = rid || _id;
		await MatrixBridgedRoom.createOrUpdateByLocalRoomId(
			roomId,
			federatedRoom.getExternalId(),
			extractServerNameFromExternalIdentifier(federatedRoom.getExternalId()),
		);
		await Rooms.setAsFederated(roomId);

		return roomId;
	}

	public async removeDirectMessageRoom(federatedRoom: FederatedRoom): Promise<void> {
		const roomId = federatedRoom.getInternalId();
		await Rooms.removeById(roomId);
		await Subscriptions.removeByRoomId(roomId);
		await MatrixBridgedRoom.removeByLocalRoomId(roomId);
	}

	public async createFederatedRoomForDirectMessage(federatedRoom: DirectMessageFederatedRoom): Promise<string> {
		const creatorId = federatedRoom.getCreatorId();
		const usernameOrId = federatedRoom.getCreatorUsername() || creatorId;
		if (!usernameOrId) {
			throw new Error('Cannot create a room without a creator');
		}
		if (!creatorId) {
			throw new Error('Cannot create a room without a creator');
		}

		const readonly = false;
		const excludeSelf = false;
		const extraData = undefined;
		const { rid, _id } = await createRoom(
			federatedRoom.getRoomType(),
			federatedRoom.getDisplayName(),
			usernameOrId,
			federatedRoom.getMembersUsernames(),
			excludeSelf,
			readonly,
			extraData,
			{ creator: creatorId },
		);
		const roomId = rid || _id;
		await MatrixBridgedRoom.createOrUpdateByLocalRoomId(
			roomId,
			federatedRoom.getExternalId(),
			extractServerNameFromExternalIdentifier(federatedRoom.getExternalId()),
		);
		await Rooms.setAsFederated(roomId);

		return roomId;
	}

	public async getDirectMessageFederatedRoomByUserIds(userIds: string[]): Promise<FederatedRoom | undefined> {
		const room = await Rooms.findOneDirectRoomContainingAllUserIDs(userIds);
		if (!room) {
			return;
		}
		const externalRoomId = await MatrixBridgedRoom.getExternalRoomId(room._id);
		if (!externalRoomId) {
			return;
		}

		if (room) {
			return this.createFederatedRoomInstance(externalRoomId, room);
		}
	}

	public async addUserToRoom(federatedRoom: FederatedRoom, inviteeUser: FederatedUser, inviterUser?: FederatedUser): Promise<void> {
		await addUserToRoom(federatedRoom.getInternalId(), inviteeUser.getInternalReference(), inviterUser?.getInternalReference());
	}

	public async addUsersToRoomWhenJoinExternalPublicRoom(federatedUsers: FederatedUser[], federatedRoom: FederatedRoom): Promise<void> {
		const room = await Rooms.findOneById(federatedRoom.getInternalId());
		if (!room) {
			throw new Error('Room not found - addUsersToRoomWhenJoinExternalPublicRoom');
		}
		await Promise.all(
			federatedUsers
				.map(async (federatedUser) => {
					const internalUser = await Users.findOneById(federatedUser.getInternalId());
					if (!internalUser) {
						return;
					}
					const subscription = await Subscriptions.findOneByRoomIdAndUserId(federatedRoom.getInternalId(), internalUser._id);
					if (subscription) {
						return;
					}
					return Subscriptions.createWithRoomAndUser(room, federatedUser.getInternalReference(), {
						ts: new Date(),
					});
				})
				.filter(Boolean),
		);
	}

	public async removeUserFromRoom(federatedRoom: FederatedRoom, affectedUser: FederatedUser, byUser: FederatedUser): Promise<void> {
		const userHasBeenRemoved = byUser.getInternalId() !== affectedUser.getInternalId();
		const options = userHasBeenRemoved ? { byUser: byUser.getInternalReference() } : undefined;
		await removeUserFromRoom(federatedRoom.getInternalId(), affectedUser.getInternalReference(), options);
	}

	public async isUserAlreadyJoined(internalRoomId: string, internalUserId: string): Promise<boolean> {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(internalRoomId, internalUserId, { projection: { _id: 1 } });

		return Boolean(subscription);
	}

	public async updateRoomType(federatedRoom: FederatedRoom): Promise<void> {
		await Rooms.setRoomTypeById(federatedRoom.getInternalId(), federatedRoom.getRoomType());
		await Subscriptions.updateAllRoomTypesByRoomId(federatedRoom.getRoomType(), federatedRoom.getRoomType());
	}

	public async updateDisplayRoomName(federatedRoom: FederatedRoom, federatedUser: FederatedUser): Promise<void> {
		await Rooms.setFnameById(federatedRoom.getInternalId(), federatedRoom.getDisplayName());
		await Subscriptions.updateNameAndFnameByRoomId(
			federatedRoom.getInternalId(),
			federatedRoom.getName() || '',
			federatedRoom.getDisplayName() || '',
		);

		await Message.saveSystemMessage(
			'r',
			federatedRoom.getInternalId(),
			federatedRoom.getDisplayName() || '',
			federatedUser.getInternalReference() as unknown as Required<IUser>, // TODO fix type
		);
	}

	public async updateRoomName(federatedRoom: FederatedRoom): Promise<void> {
		await Rooms.setRoomNameById(federatedRoom.getInternalId(), federatedRoom.getName());
		await Subscriptions.updateNameAndFnameByRoomId(
			federatedRoom.getInternalId(),
			federatedRoom.getName() || '',
			federatedRoom.getDisplayName() || '',
		);
	}

	public async updateRoomTopic(federatedRoom: FederatedRoom, federatedUser: FederatedUser): Promise<void> {
		await saveRoomTopic(
			federatedRoom.getInternalId(),
			federatedRoom.getTopic(),
			federatedUser.getInternalReference() as WithRequiredProperty<IUser, 'username'>,
		);
	}

	private async createFederatedRoomInstance<T extends IRoom | IDirectMessageRoom>(externalRoomId: string, room: T): Promise<FederatedRoom> {
		if (isDirectMessageRoom(room)) {
			const members = (await Promise.all(
				(room.usernames || []).map((username) => getFederatedUserByInternalUsername(username)).filter(Boolean),
			)) as FederatedUser[];
			return DirectMessageFederatedRoom.createWithInternalReference(externalRoomId, room, members);
		}

		return FederatedRoom.createWithInternalReference(externalRoomId, room);
	}

	public async updateFederatedRoomByInternalRoomId(internalRoomId: string, externalRoomId: string): Promise<void> {
		await MatrixBridgedRoom.createOrUpdateByLocalRoomId(
			internalRoomId,
			externalRoomId,
			extractServerNameFromExternalIdentifier(externalRoomId),
		);
		await Rooms.setAsFederated(internalRoomId);
	}

	public async getInternalRoomRolesByUserId(internalRoomId: string, internalUserId: string): Promise<string[]> {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(internalRoomId, internalUserId, { projection: { roles: 1 } });
		if (!subscription) {
			return [];
		}
		return subscription.roles || [];
	}

	public async applyRoomRolesToUser({
		federatedRoom,
		fromUser,
		targetFederatedUser,
		notifyChannel,
		rolesToAdd,
		rolesToRemove,
	}: {
		federatedRoom: FederatedRoom;
		targetFederatedUser: FederatedUser;
		fromUser: FederatedUser;
		rolesToAdd: ROCKET_CHAT_FEDERATION_ROLES[];
		rolesToRemove: ROCKET_CHAT_FEDERATION_ROLES[];
		notifyChannel: boolean;
	}): Promise<void> {
		const subscription = await Subscriptions.findOneByRoomIdAndUserId(federatedRoom.getInternalId(), targetFederatedUser.getInternalId(), {
			projection: { roles: 1 },
		});
		if (!subscription) {
			return;
		}
		const { roles: currentRoles = [] } = subscription;
		const toAdd = rolesToAdd.filter((role) => !currentRoles.includes(role));
		const toRemove = rolesToRemove.filter((role) => currentRoles.includes(role));
		const whoDidTheChange = {
			_id: fromUser.getInternalId(),
			username: fromUser.getUsername(),
		};
		if (toAdd.length > 0) {
			await Subscriptions.addRolesByUserId(targetFederatedUser.getInternalId(), toAdd, federatedRoom.getInternalId());
			if (notifyChannel) {
				await Promise.all(
					toAdd.map((role) =>
						Message.saveSystemMessage(
							'subscription-role-added',
							federatedRoom.getInternalId(),
							targetFederatedUser.getInternalReference().username || '',
							whoDidTheChange,
							{ role },
						),
					),
				);
			}
		}
		if (toRemove.length > 0) {
			await Subscriptions.removeRolesByUserId(targetFederatedUser.getInternalId(), toRemove, federatedRoom.getInternalId());
			if (notifyChannel) {
				await Promise.all(
					toRemove.map((role) =>
						Message.saveSystemMessage(
							'subscription-role-removed',
							federatedRoom.getInternalId(),
							targetFederatedUser.getInternalReference().username || '',
							whoDidTheChange,
							{ role },
						),
					),
				);
			}
		}
		if (settings.get('UI_DisplayRoles')) {
			this.notifyUIAboutRoomRolesChange(targetFederatedUser, federatedRoom, toAdd, toRemove);
		}
	}

	private notifyUIAboutRoomRolesChange(
		targetFederatedUser: FederatedUser,
		federatedRoom: FederatedRoom,
		addedRoles: ROCKET_CHAT_FEDERATION_ROLES[],
		removedRoles: ROCKET_CHAT_FEDERATION_ROLES[],
	): void {
		const eventsForAddedRoles = addedRoles.map((role) => this.createRoleUpdateEvent(targetFederatedUser, federatedRoom, role, 'added'));
		const eventsForRemovedRoles = removedRoles.map((role) =>
			this.createRoleUpdateEvent(targetFederatedUser, federatedRoom, role, 'removed'),
		);
		[...eventsForAddedRoles, ...eventsForRemovedRoles].forEach((event) => api.broadcast('user.roleUpdate', event));
	}

	private createRoleUpdateEvent(
		federatedUser: FederatedUser,
		federatedRoom: FederatedRoom,
		role: string,
		action: 'added' | 'removed',
	): {
		type: 'added' | 'removed' | 'changed';
		_id: string;
		u?: { _id: IUser['_id']; username: IUser['username']; name: IUser['name'] };
		scope?: string;
	} {
		return {
			type: action,
			_id: role,
			u: {
				_id: federatedUser.getInternalId(),
				username: federatedUser.getUsername(),
				name: federatedUser.getName(),
			},
			scope: federatedRoom.getInternalId(),
		};
	}
}
