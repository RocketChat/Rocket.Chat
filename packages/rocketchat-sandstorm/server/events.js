/* globals getHttpBridge, waitPromise */

RocketChat.Sandstorm.notify = function() {};

if (process.env.SANDSTORM === '1') {
	const ACTIVITY_TYPES = {
		'message': 0,
		'privateMessage': 1
	};

	RocketChat.Sandstorm.notify = function(message, userIds, caption, type) {
		const sessionId = message.sandstormSessionId;
		if (!sessionId) {
			return;
		}
		const httpBridge = getHttpBridge();
		const activity = {};

		if (type) {
			activity.type = ACTIVITY_TYPES[type];
		}

		if (caption) {
			activity.notification = {caption: {defaultText: caption}};
		}

		if (userIds) {
			activity.users = _.map(userIds, function(userId) {
				const user = Meteor.users.findOne({_id: userId}, {fields: {'services.sandstorm.id': 1}});
				return {
					identity: waitPromise(httpBridge.getSavedIdentity(user.services.sandstorm.id)).identity,
					mentioned: true
				};
			});
		}

		return waitPromise(httpBridge.getSessionContext(sessionId).context.activity(activity));
	};
}
