import _ from 'underscore';
import s from 'underscore.string';

RocketChat.checkUsernameAvailability = function(username) {
	return RocketChat.settings.get('Accounts_BlockedUsernameList', function(key, value) {
		const usernameBlackList = _.map(value.split(','), function(username) {
			return username.trim();
		});
		if (usernameBlackList.length !== 0) {
			if (usernameBlackList.every(restrictedUsername => {
				const regex = new RegExp(`^${ s.escapeRegExp(restrictedUsername) }$`, 'i');
				return !regex.test(s.trim(s.escapeRegExp(username)));
			})) {
				return !Meteor.users.findOne({
					username: {
						$regex: new RegExp(`^${ s.trim(s.escapeRegExp(username)) }$`, 'i')
					}
				});
			}
			return false;
		}
	});
};
