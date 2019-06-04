import { callbacks } from '../../../callbacks/server';
import { Users, Rooms } from '../../../models/server';

callbacks.add('afterCreateUser', (userId) => {
	console.log(userId);
	const user = Users.findOneById(userId, { fields: { u: 1, username: 1 } });
	console.log(user);
	if (!user || !user.u) {
		return userId;
	}

	const extraData = {
		sa: true
	};

	if (!Rooms.findOneByName(`broadcast_${ user.username }`)) {
		createRoom('p', `broadcast_${ user.username }`, user.username, [], false, extraData, {});
	}

	return userId;
});
