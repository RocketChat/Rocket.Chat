// import { Meteor } from 'meteor/meteor';
// import { settings } from '../../settings';
// import { Mongo } from 'meteor/mongo';

import { createRoom } from '../../lib/server/functions';
import { Users, Rooms } from '../../models';

function initializeNewsfeed() {
	const usersArray = Users.findByUsername().fetch();
	usersArray.forEach((user) => {
		if (user.type === 'user') {
			if (!Rooms.findOneByName(`news_${ user._id }`)) {
				createRoom('n', `news_${ user._id }`, user.username, [], true, {}, {});
			}
		}
	});
}

export { initializeNewsfeed };
