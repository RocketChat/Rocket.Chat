import { Abac } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { Users } from '@rocket.chat/models';

import { scopeAdminRoomForAbac } from '../../../../app/api/server/lib/scopeAdminRoomForAbac';
import { isABACManagedRoom } from '../../../../app/authorization/server/lib/isABACManagedRoom';

scopeAdminRoomForAbac.patch(async (next, room, uid) => {
	if (!License.hasModule('abac') || !isABACManagedRoom(room)) {
		return next(room, uid);
	}

	const user = await Users.findOneById(uid, { projection: { _id: 1, username: 1, name: 1 } });
	if (!user) {
		return next(room, uid);
	}

	const [scoped] = await Abac.scopeRoomsForAdmin([room], { _id: user._id, username: user.username, name: user.name });
	return scoped ?? next(room, uid);
});
