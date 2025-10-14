import { Abac, Authorization } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { Subscriptions } from '@rocket.chat/models';

import { AbacLogger } from './logger';
import { canAccessSpecialRoom } from '../../../../app/lib/server/lib/canAccessSpecialRoom';
import { settings } from '../../../../app/settings/server';

canAccessSpecialRoom.patch(async (_prev, room, user) => {
	if (!room?.abacAttributes?.length || !user || !License.hasModule('abac') || room.t !== 'p' || !settings.get('Abac_Enabled')) {
		// ignore the check and let other checks run
		return false;
	}

	const decisionCacheTimeout = settings.get<number>('Abac_Cache_Decision_Time_Seconds');
	const userSub = await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id, { projection: { abacLastTimeChecked: 1 } });
	if (!userSub) {
		return false;
	}

	// Timeout is invalid, we check (not recommended)
	if (decisionCacheTimeout <= 0) {
		AbacLogger.warn({ msg: 'ABAC decision cache is too low', decisionCacheTimeout });
		return Abac.canAccessRoom(room, user);
	}

	const [canViewJoined, canViewP] = await Promise.all([
		Authorization.hasPermission(user._id, 'view-joined-room'),
		Authorization.hasPermission(user._id, `view-p-room`),
	]);

	if (userSub.abacLastTimeChecked && Date.now() - userSub.abacLastTimeChecked.getTime() < decisionCacheTimeout * 1000) {
		AbacLogger.debug({ msg: 'Using cached ABAC decision', userId: user._id, roomId: room._id });
		return !!userSub && (canViewJoined || canViewP);
	}

	return (await Abac.canAccessRoom(room, user)) && (canViewJoined || canViewP);
});
