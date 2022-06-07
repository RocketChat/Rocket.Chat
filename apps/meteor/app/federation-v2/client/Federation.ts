import { IRoom, ValueOf } from '@rocket.chat/core-typings';

import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';

export type FEDERATION_MESSAGE_ACTION_CONTEXT = 'federated';
const allowedActionsInFederatedRooms: ValueOf<typeof RoomMemberActions>[] = [RoomMemberActions.REMOVE_USER];

const A = {
	thread: false,
	discussion: false,
	call: false,
	files: false,
	pinned: false,
	livestream: false,
	prune: false,
	private: false,
	readonly: false,
	encrypted: false,
	broadcast: false,
}

export class Federation {
	public static isAFederatedRoom(room: IRoom): boolean {
		return room.federated === true;
	}

	public static getMessageActionContextName(): FEDERATION_MESSAGE_ACTION_CONTEXT {
		return 'federated';
	}

	public static federationActionAllowed(action: ValueOf<typeof RoomMemberActions>): boolean {
		return allowedActionsInFederatedRooms.includes(action);
	}
}
