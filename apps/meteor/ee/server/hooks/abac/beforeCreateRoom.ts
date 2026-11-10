import { AbacContractError, AbacErrorCode } from '@rocket.chat/abac';
import { Abac } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import {
	isDiscussion,
	isOmnichannelRoom,
	isPublicRoom,
	isRoomFederated,
	isRoomXMPPFederated,
	isPrivateRoom,
} from '@rocket.chat/core-typings';
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
		throw new AbacContractError(AbacErrorCode.NotEnabled);
	}

	// Remote members cannot be evaluated by the PDP.
	if (isRoomFederated(room) || isRoomXMPPFederated(room)) {
		throw new AbacContractError(AbacErrorCode.FederatedRoomAttributes);
	}

	if (isDiscussion(room)) {
		throw new AbacContractError(AbacErrorCode.DiscussionRoomAttributes);
	}

	if (!isPrivateRoom(room)) {
		throw new AbacContractError(AbacErrorCode.AttributesPrivateRoomsOnly);
	}

	if (!(await hasPermissionAsync(owner._id, 'create-abac-managed-room'))) {
		throw new AbacContractError(AbacErrorCode.AttributesNotAllowed);
	}

	const attributes = Object.fromEntries(room.abacAttributes.map(({ key, values }) => [key, values]));
	const result = await Abac.validateCreationAttributes(attributes, toAbacActor(owner), {
		creatorJoins: !!owner.username && members.includes(owner.username),
	});
	if (!result.allowed) {
		throw toCreationAttributesDenialError(result);
	}

	room.abacAttributes = result.attributes;
};

const refuseRoomsEnforcementWouldLock = (room: RoomToCreate): void => {
	const lockContext = getRoomAbacLockContext();

	if (!lockContext.enforcementOn || isRoomFederated(room) || isRoomXMPPFederated(room) || isOmnichannelRoom(room)) {
		return;
	}

	if (isDiscussion(room)) {
		throw new AbacContractError(AbacErrorCode.DiscussionCreationBlocked);
	}

	if (isPublicRoom(room)) {
		throw new AbacContractError(AbacErrorCode.PublicRoomCreationBlocked);
	}

	if (isRoomAbacLocked(room, lockContext)) {
		throw new AbacContractError(AbacErrorCode.AttributesRequired);
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
