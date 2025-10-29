import { Abac } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { beforeAddUserToRoom } from '../../../../app/lib/server/lib/beforeAddUserToRoom';
import { settings } from '../../../../app/settings/server';

beforeAddUserToRoom.patch(async (prev, users, room, actor) => {
	await prev(users, room, actor);

	const validUsers = users.filter(Boolean);
	if (
		!room?.abacAttributes?.length ||
		!validUsers.length ||
		!License.hasModule('abac') ||
		room.t !== 'p' ||
		!settings.get('ABAC_Enabled')
	) {
		return;
	}

	await Abac.checkUsernamesMatchAttributes(validUsers as string[], room.abacAttributes);
});
