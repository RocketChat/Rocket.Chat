import { Abac } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { isDiscussion, isOmnichannelRoom, isPublicRoom, isRoomFederated, isPrivateRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';

import { isRoomAbacLocked } from '../../../../lib/rooms/isRoomAbacLocked';
import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';
import { hasPermissionAsync } from '../../../../server/lib/authorization/hasPermission';
import { callbacks } from '../../../../server/lib/callbacks';
import { beforeCreateRoomCallback } from '../../../../server/lib/callbacks/beforeCreateRoomCallback';
import { settings } from '../../../../server/settings';
import { toCreationAttributesDenialError } from '../../lib/abac/creationAttributesDenial';
import { toAbacActor } from '../../lib/abac/toAbacActor';

type RoomToCreate = Omit<IRoom, '_id' | '_updatedAt'>;

const assignCreationAttributes = async (owner: IUser, room: RoomToCreate, members: string[]): Promise<void> => {
	if (!room.abacAttributes?.length) {
		return;
	}

	if (!settings.get('ABAC_Enabled') || !License.hasModule('abac')) {
		throw new Error('error-abac-not-enabled');
	}

	// Remote members cannot be evaluated by the PDP.
	if (isRoomFederated(room)) {
		throw new Error('error-abac-federated-room-attributes');
	}

	if (isDiscussion(room) || !isPrivateRoom(room)) {
		throw new Error('error-abac-attributes-private-rooms-only');
	}

	if (!(await hasPermissionAsync(owner._id, 'create-abac-managed-room'))) {
		throw new Error('error-abac-attributes-not-allowed');
	}

	const result = await Abac.validateCreationAttributes(room.abacAttributes, toAbacActor(owner), {
		creatorJoins: !!owner.username && members.includes(owner.username),
	});
	if (!result.allowed) {
		throw toCreationAttributesDenialError(result);
	}

	room.abacAttributes = result.attributes;
};

const refuseRoomsEnforcementWouldLock = (room: RoomToCreate): void => {
	const lockContext = getRoomAbacLockContext();

	if (!lockContext.enforcementOn || isOmnichannelRoom(room)) {
		return;
	}

	if (isRoomFederated(room)) {
		throw new Error('error-abac-federated-room-creation-blocked');
	}

	// `Discussion_enabled` is also held at false; this covers the callers that bypass it.
	if (isDiscussion(room)) {
		throw new Error('error-abac-discussion-creation-blocked');
	}

	if (isPublicRoom(room)) {
		throw new Error('error-abac-public-room-creation-blocked');
	}

	if (isRoomAbacLocked(room, lockContext)) {
		throw new Error('error-abac-attributes-required');
	}
};

beforeCreateRoomCallback.add(
	async ({ owner, room, members }) => {
		await assignCreationAttributes(owner, room, members);

		refuseRoomsEnforcementWouldLock(room);
	},
	callbacks.priority.HIGH,
	'abac-room-creation-guard',
);
