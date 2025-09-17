import type { IRoom, IUser, Username } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { callbacks } from '../../../../../../../lib/callbacks';
import { beforeAddUserToARoom } from '../../../../../../../lib/callbacks/beforeAddUserToARoom';
import { throwIfFederationNotEnabledOrNotReady } from '../../../../../../../server/services/federation/utils';

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class FederationHooksEE {
	public static onFederatedRoomCreated(callback: (room: IRoom, owner: IUser, originalMemberList: string[]) => Promise<void>): void {
		callbacks.add(
			'federation.afterCreateFederatedRoom',
			async (room: IRoom, params: { owner: IUser; originalMemberList: string[] }) => {
				if (!room || !isRoomFederated(room) || !params || !params.owner || !params.originalMemberList) {
					return;
				}

				throwIfFederationNotEnabledOrNotReady();

				await callback(room, params.owner, params.originalMemberList);
			},
			callbacks.priority.HIGH,
			'federation-v2-after-create-room',
		);
	}

	public static onUsersAddedToARoom(callback: (room: IRoom, addedUsers: IUser[] | Username[], inviter?: IUser) => Promise<void>): void {
		callbacks.add(
			'federation.onAddUsersToRoom',
			async (params: { invitees: IUser[] | Username[]; inviter: IUser }, room: IRoom) => {
				if (!room || !isRoomFederated(room) || !params || !params.invitees || !params.inviter) {
					return;
				}

				throwIfFederationNotEnabledOrNotReady();

				await callback(room, params.invitees, params.inviter);
			},
			callbacks.priority.HIGH,
			'federation-v2-on-add-users-to-a-room',
		);
		callbacks.add(
			'afterAddedToRoom',
			async (params: { user: IUser; inviter?: IUser }, room: IRoom) => {
				if (!room || !isRoomFederated(room) || !params || !params.user) {
					return;
				}

				throwIfFederationNotEnabledOrNotReady();

				await callback(room, [params.user], params?.inviter);
			},
			callbacks.priority.HIGH,
			'federation-v2-after-add-user-to-a-room',
		);
	}

	public static onDirectMessageRoomCreated(callback: (room: IRoom, creatorId: string, memberList: IUser[]) => Promise<void>): void {
		callbacks.add(
			'afterCreateDirectRoom',
			async (room: IRoom, params: { members: IUser[]; creatorId: IUser['_id'] }) => {
				if (!room || !params || !params.creatorId || !params.creatorId) {
					return;
				}
				throwIfFederationNotEnabledOrNotReady();
				await callback(room, params.creatorId, params.members);
			},
			callbacks.priority.HIGH,
			'federation-v2-after-create-direct-message-room',
		);
	}

	public static beforeDirectMessageRoomCreate(callback: (memberList: IUser[]) => Promise<void>): void {
		callbacks.add(
			'beforeCreateDirectRoom',
			async (members: IUser[]) => {
				if (!members) {
					return;
				}
				throwIfFederationNotEnabledOrNotReady();
				await callback(members);
			},
			callbacks.priority.HIGH,
			'federation-v2-before-create-direct-message-room',
		);
	}

	public static beforeAddUserToARoom(callback: (userToBeAdded: IUser | string, room: IRoom, inviter?: IUser) => Promise<void>): void {
		beforeAddUserToARoom.add(
			async (params, room: IRoom) => {
				if (!room || !isRoomFederated(room) || !params || !params.user) {
					return;
				}
				throwIfFederationNotEnabledOrNotReady();

				const inviter = (params.inviter && (await Users.findOneById(params.inviter._id))) || undefined;
				await callback(params.user, room, inviter);
			},
			callbacks.priority.HIGH,
			'federation-v2-before-add-user-to-the-room',
		);
	}

	public static removeAllListeners(): void {
		callbacks.remove('beforeCreateDirectRoom', 'federation-v2-before-create-direct-message-room');
		callbacks.remove('afterCreateDirectRoom', 'federation-v2-after-create-direct-message-room');
		callbacks.remove('federation.onAddUsersToRoom', 'federation-v2-on-add-users-to-a-room');
		callbacks.remove('afterAddedToRoom', 'federation-v2-after-add-user-to-a-room');
		callbacks.remove('federation.afterCreateFederatedRoom', 'federation-v2-after-create-room');
		beforeAddUserToARoom.remove('federation-v2-before-add-user-to-the-room');
	}
}
