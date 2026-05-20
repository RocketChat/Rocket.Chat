import { Abac } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';
import { Users } from '@rocket.chat/models';

import { scopeAdminRoomsForAbac } from '../../../../app/api/server/lib/scopeAdminRoomsForAbac';
import { isABACManagedRoom } from '../../../../app/authorization/server/lib/isABACManagedRoom';

scopeAdminRoomsForAbac.patch(async (next, rooms, uid) => {
	const managed = License.hasModule('abac') ? rooms.filter(isABACManagedRoom) : [];
	if (!managed.length) {
		return next(rooms, uid);
	}

	const user = await Users.findOneById(uid, { projection: { _id: 1, username: 1, name: 1 } });
	if (!user) {
		return next(rooms, uid);
	}

	const scoped = await Abac.scopeRoomsForAdmin(managed, { _id: user._id, username: user.username, name: user.name });
	let i = 0;
	return rooms.map((r) => (isABACManagedRoom(r) ? scoped[i++] : r));
});
