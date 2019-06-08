import { callbacks } from '../../../callbacks/server';
import { Rooms } from '../../../models/server';
import { createRoom } from '../../../lib/server/functions';

callbacks.add('afterCreateUser', (user) => {
	if (!user || !user.u) {
		return user;
	}

	const extraData = {
		sa: true,
	};

	if (!Rooms.findOneByName(`broadcast_${ user.username }`)) {
		createRoom('p', `broadcast_${ user.username }`, user.username, [], false, extraData, {});
	}

	return user;
});
