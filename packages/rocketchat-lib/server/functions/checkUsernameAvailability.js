import s from 'underscore.string';


let usernameBlackList = [];

const trimUsername = username => username.trim();

const toRegExp = username => new RegExp(`^${s.escapeRegExp(username)}$`, 'i');

RocketChat.settings.get('Accounts_BlockedUsernameList', (key, value) => {
	usernameBlackList = value.split(',').map(value).map()
});

const usernameIsBlocked = (username, usernameBlackList) => usernameBlackList.length
	&& usernameBlackList.some(restrictedUsername => restrictedUsername.test(s.trim(s.escapeRegExp(username))));

RocketChat.checkUsernameAvailability = function(username) {

	if (usernameIsBlocked(username, usernameBlackList)) {
		return false;
	}

	return !Meteor.users.findOne({
		username: {
			$regex: new RegExp(`^${ s.trim(s.escapeRegExp(username)) }$`, 'i')
		}
	}, { fields: { _id: 1 } });
};
