import { Abac, Authorization } from '@rocket.chat/core-services';
import { AbacAccessOperation, AbacObjectType } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';

import { canAccessSpecialRoom } from '../../../../app/lib/server/lib/canAccessSpecialRoom';
import { settings } from '../../../../app/settings/server';

canAccessSpecialRoom.patch(async (_prev, room, user) => {
	if (!room?.abacAttributes?.length || !user || !License.hasModule('abac') || room.t !== 'p' || !settings.get('Abac_Enabled')) {
		// ignore the check and let other checks run
		return false;
	}

	const [canViewJoined, canViewP] = await Promise.all([
		Authorization.hasPermission(user._id, 'view-joined-room'),
		Authorization.hasPermission(user._id, `view-p-room`),
	]);

	return (canViewJoined || canViewP) && Abac.canAccessObject(room, user, AbacAccessOperation.READ, AbacObjectType.ROOM);
});
