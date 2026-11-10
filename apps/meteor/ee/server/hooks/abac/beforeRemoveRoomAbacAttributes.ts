import { AbacContractError, AbacErrorCode } from '@rocket.chat/abac';
import { License } from '@rocket.chat/license';

import { beforeRemoveRoomAbacAttributes } from '../../../../server/hooks/rooms/beforeRemoveRoomAbacAttributes';
import { getRoomAbacLockContext } from '../../../../server/lib/authorization/getRoomAbacLockContext';
import { hasAllPermissionAsync, hasPermissionAsync } from '../../../../server/lib/authorization/hasPermission';

beforeRemoveRoomAbacAttributes.patch(async (prev, room, actor) => {
	await prev(room, actor);

	if (!License.hasModule('abac')) {
		return;
	}

	if (await hasAllPermissionAsync(actor._id, ['abac-management', 'manage-abac-admin-rooms'])) {
		return;
	}

	if (!(await hasPermissionAsync(actor._id, 'edit-room-abac-attributes', room._id))) {
		throw new AbacContractError(AbacErrorCode.NotAuthorizedToModifyRoom);
	}

	const { enforcementOn, requiredAttributeKeys } = getRoomAbacLockContext();
	if (enforcementOn && requiredAttributeKeys.length) {
		throw new AbacContractError(AbacErrorCode.RoomAttributesCleared);
	}
});
