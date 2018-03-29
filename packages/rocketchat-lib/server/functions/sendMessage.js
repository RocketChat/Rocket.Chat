import _ from 'underscore';

RocketChat.sendMessage = function(user, message, room, upsert = false) {
	if (!user || !message || !room._id) {
		return false;
	}

	if (!Match.test(message.msg, String)) {
		message.msg = '';
	}

	if (message.ts == null) {
		message.ts = new Date();
	}

	message.rid = room._id;
	message.u = _.pick(user, ['_id', 'username', 'name']);

	if (!room.usernames || room.usernames.length === 0) {
		const updated_room = RocketChat.models.Rooms.findOneById(room._id);
		if (updated_room) {
			room = updated_room;
		} else {
			room.usernames = [];
		}
	}

	if (message.parseUrls !== false) {
		const urls = message.msg.match(/([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\(\)\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g);

		if (urls) {
			message.urls = urls.map(function(url) {
				return {
					url
				};
			});
		}
	}

	if (RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
		message.unread = true;
	}

	message = RocketChat.callbacks.run('beforeSaveMessage', message);
	if (message) {
		// Avoid saving sandstormSessionId to the database
		let sandstormSessionId = null;
		if (message.sandstormSessionId) {
			sandstormSessionId = message.sandstormSessionId;
			delete message.sandstormSessionId;
		}

		// For the Rocket.Chat Apps :)
		if (Apps && Apps.isLoaded()) {
			const prevent = Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentPrevent', message);
			if (prevent) {
				return false;
			}

			// TODO: The rest of the IPreMessageSent events
		}

		if (message._id && upsert) {
			const _id = message._id;
			delete message._id;
			RocketChat.models.Messages.upsert({
				_id,
				'u._id': message.u._id
			}, message);
			message._id = _id;
		} else {
			message._id = RocketChat.models.Messages.insert(message);
		}

		if (Apps && Apps.isLoaded()) {
			Apps.getBridges().getListenerBridge().messageEvent('IPostMessageSent', message);
		}

		/*
		Defer other updates as their return is not interesting to the user
		*/
		Meteor.defer(() => {
			// Execute all callbacks
			message.sandstormSessionId = sandstormSessionId;
			return RocketChat.callbacks.run('afterSaveMessage', message, room, user._id);
		});
		return message;
	}
};
