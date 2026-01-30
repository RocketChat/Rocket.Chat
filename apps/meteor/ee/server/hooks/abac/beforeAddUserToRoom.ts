import { Abac } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { beforeAddUserToRoom } from '../../../../app/lib/server/lib/beforeAddUserToRoom';
import { settings } from '../../../../app/settings/server';

beforeAddUserToRoom.patch(async (prev, users, room, actor) => {
	await prev(users, room, actor);

	const validUsers = users.filter(Boolean);
	// No need to check ABAC when theres no users or when room is not private or when room is not ABAC managed
	if (!validUsers.length || room.t !== 'p' || !room?.abacAttributes?.length) {
		return;
	}

	// Throw error (prevent add) if ABAC is disabled (setting, license) but room is ABAC managed
	if (!settings.get('ABAC_Enabled') || !License.hasModule('abac')) {
		throw new Error('error-room-is-abac-managed');
	}

	await Abac.checkUsernamesMatchAttributes(validUsers as string[], room.abacAttributes, room);
});
