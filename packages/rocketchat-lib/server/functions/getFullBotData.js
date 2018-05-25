/* globals RocketChat */
import s from 'underscore.string';

RocketChat.getFullBotData = function({userId, filter, limit}) {

	if (!RocketChat.authz.hasPermission(userId, 'view-bot-administration')) {
		throw new Meteor.Error('error-action-not-allowed', 'Viewing bots is not allowed', {
			method: 'getFullBotData',
			action: 'Subscribing_to_bots'
		});
	}

	const fields = {
		account: 1,
		framework: 1,
		running: 1,
		ipAddress: 1
	};

	filter = s.trim(filter);

	if (!filter && limit === 1) {
		return undefined;
	}

	const options = {
		fields,
		limit,
		sort: { 'account.username': 1 }
	};

	if (filter) {
		return RocketChat.models.Bots.findByUsername(filter, options);
	}

	return RocketChat.models.Users.find({}, options);
};
