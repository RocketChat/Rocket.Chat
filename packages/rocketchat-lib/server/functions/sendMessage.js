const validateBodyAttachments = (attachments) => {

	const validateAttachmentsFields = (attachmentFields) => {
		check(attachmentFields, Match.ObjectIncluding({
			short: Match.Maybe(Boolean),
			title: String,
			value: String
		}));
	};

	const validateAttachment = (attachment) => {
		check(attachment, Match.ObjectIncluding({
			color: Match.Maybe(String),
			text: Match.Maybe(String),
			ts: Match.Maybe(String),
			thumb_url: Match.Maybe(String),
			message_link: Match.Maybe(String),
			collapsed: Match.Maybe(Boolean),
			author_name: Match.Maybe(String),
			author_link: Match.Maybe(String),
			author_icon: Match.Maybe(String),
			title: Match.Maybe(String),
			title_link: Match.Maybe(String),
			title_link_download: Match.Maybe(Boolean),
			image_url: Match.Maybe(String),
			audio_url: Match.Maybe(String),
			video_url: Match.Maybe(String)
		}));

		if (attachment.fields.length) {
			attachment.fields.map(validateAttachmentsFields);
		}
	};

	attachments.map(validateAttachment);
};

RocketChat.sendMessage = function(user, message, room, upsert = false) {
	if (!user || !message || !room._id) {
		return false;
	}

	check(message, Match.ObjectIncluding({
		_id: Match.Maybe(String),
		msg: Match.Maybe(String),
		text: Match.Maybe(String),
		alias: Match.Maybe(String),
		emoji: Match.Maybe(String),
		avatar: Match.Maybe(String),
		attachments: Match.Maybe(Array)
	}));

	if (Array.isArray(message.attachments) && message.attachments.length) {
		validateBodyAttachments(message.attachments);
	}

	if (!message.ts) {
		message.ts = new Date();
	}
	const { _id, username, name } = message;
	message.u = {
		_id,
		username,
		name
	};
	message.rid = room._id;

	if (!Match.test(message.msg, String)) {
		message.msg = '';
	}

	if (message.ts == null) {
		message.ts = new Date();
	}

	if (!room.usernames || room.usernames.length === 0) {
		const updated_room = RocketChat.models.Rooms.findOneById(room._id);
		if (updated_room) {
			room = updated_room;
		} else {
			room.usernames = [];
		}
	}

	if (RocketChat.settings.get('Message_Read_Receipt_Enabled')) {
		message.unread = true;
	}

	// For the Rocket.Chat Apps :)
	if (message && Apps && Apps.isLoaded()) {
		const prevent = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentPrevent', message));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-sending', 'A Rocket.Chat App prevented the messaging sending.');
		}

		let result;
		result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentExtend', message));
		result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentModify', result));

		if (typeof result === 'object') {
			message = Object.assign(message, result);
		}
	}

	if (message.parseUrls !== false) {
		const urlRegex = /([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\(\)\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g;
		const urls = message.msg.match(urlRegex);
		if (urls) {
			// ignoredUrls contain blocks of quotes with urls inside
			const ignoredUrls = message.msg.match(/(?:(?:\`{1,3})(?:[\n\r]*?.*?)*?)(([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\(\)\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?)(?:(?:[\n\r]*.*?)*?(?:\`{1,3}))/gm);
			if (ignoredUrls) {
				ignoredUrls.forEach((url) => {
					const shouldBeIgnored = url.match(urlRegex);
					if (shouldBeIgnored) {
						shouldBeIgnored.forEach((match) => {
							const matchIndex = urls.indexOf(match);
							urls.splice(matchIndex, 1);
						});
					}
				});
			}
			if (urls) {
				// use the Set to remove duplicity, so it doesn't embed the same link twice
				message.urls = [...new Set(urls)].map(function(url) {
					return {
						url
					};
				});
			}
		}
	}

	message = RocketChat.callbacks.run('beforeSaveMessage', message);
	if (message) {
		// Avoid saving sandstormSessionId to the database
		let sandstormSessionId = null;
		if (message.sandstormSessionId) {
			sandstormSessionId = message.sandstormSessionId;
			delete message.sandstormSessionId;
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
			// This returns a promise, but it won't mutate anything about the message
			// so, we don't really care if it is successful or fails
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
