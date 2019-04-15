import { Meteor } from 'meteor/meteor';
import { Users } from '../../../../models/server/s';
/*
Up to now, there's no "DB version" stored for assistify.
Until we've got expensive of contradicting migrations, we'll just use this file to write functions running
on startup which migrate data - ignoring the actual version
 */

Meteor.startup(() => {

	const _guessNameFromUsername = function(username = '', email = '') {
		return (username || email.replace(/@.*/, ''))
			.replace(/\W/g, ' ')
			.replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
			.replace(/^(.)/, function($1) { return $1.toLowerCase(); })
			.replace(/^\w/, function($1) { return $1.toUpperCase(); });
	};

	const usersWithoutName = Users.find({ name: null }).fetch();
	usersWithoutName.forEach((user) => {
		if (user.username || (user.emails && user.emails.length > 0)) {
			Users.update({ _id: user._id }, { $set: { name: _guessNameFromUsername(user.username, user.emails[0].address) } });
		}
	});

});
