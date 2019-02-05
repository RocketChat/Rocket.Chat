import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';


let usernameBlackList = [];

const toRegExp = (username) => new RegExp(`^${ s.escapeRegExp(username).trim() }$`, 'i');

RocketChat.settings.get('Accounts_BlockedUsernameList', (key, value) => {
	usernameBlackList = value.split(',').map(toRegExp);
});

const usernameIsBlocked = (username, usernameBlackList) => usernameBlackList.length
	&& usernameBlackList.some((restrictedUsername) => restrictedUsername.test(s.trim(s.escapeRegExp(username))));

RocketChat.checkUsernameAvailability = function(username) {

	if (usernameIsBlocked(username, usernameBlackList)) {
		return false;
	}

	return !Meteor.users.findOne({
		username: {
			$regex: toRegExp(username),
		},
	}, { fields: { _id: 1 } });
};
