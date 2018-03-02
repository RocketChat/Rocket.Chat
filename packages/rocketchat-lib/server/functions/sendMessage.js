import _ from 'underscore';

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

	try {
		check(message, Match.ObjectIncluding({
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
	} catch (error) {
		throw error;
	}

	if (message.ts == null) {
		message.ts = new Date();
	}
	message.u = _.pick(user, ['_id', 'username', 'name']);
	if (!Match.test(message.msg, String)) {
		message.msg = '';
	}
	message.rid = room._id;
	if (!room.usernames || room.usernames.length === 0) {
		const updated_room = RocketChat.models.Rooms.findOneById(room._id);
		if (updated_room != null) {
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
