import { Abac } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { beforeAddUserToRoom } from '../../../../app/lib/server/lib/beforeAddUserToRoom';

beforeAddUserToRoom.patch(async (prev, users, room, actor) => {
	await prev(users, room, actor);

	if (!room?.abacAttributes?.length || !users.filter(Boolean).length || !License.hasModule('abac') || room.t !== 'p') {
		return;
	}

	await Abac.checkUsernamesMatchAttributes(users as string[], room.abacAttributes);
});
