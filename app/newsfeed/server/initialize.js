// import { Meteor } from 'meteor/meteor';
// import { settings } from '../../settings';
// import { Mongo } from 'meteor/mongo';

import { Users } from '../../models';

function initializeNewsfeed() {
	const usersArray = Users.findByUsername().fetch();
	usersArray.forEach((user) => {
		if (user.type === 'user') {
			console.log(user.name);
		}
	});
}

export { initializeNewsfeed };
