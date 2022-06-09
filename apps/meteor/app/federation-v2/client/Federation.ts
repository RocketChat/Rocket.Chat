import { ValueOf } from '@rocket.chat/core-typings';

import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';

const allowedActionsInFederatedRooms: ValueOf<typeof RoomMemberActions>[] = [RoomMemberActions.REMOVE_USER];

export class Federation {
	public static federationActionAllowed(action: ValueOf<typeof RoomMemberActions>): boolean {
		return allowedActionsInFederatedRooms.includes(action);
	}
}
