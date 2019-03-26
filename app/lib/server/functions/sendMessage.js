import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { Messages } from '../../../models';
import { Apps } from '../../../apps/server';
import { Markdown } from '../../../markdown/server';

const objectMaybeIncluding = (types) => Match.Where((value) => {
	Object.keys(types).forEach((field) => {
		if (value[field] != null) {
			try {
				check(value[field], types[field]);
			} catch (error) {
				error.path = field;
				throw error;
			}
		}
	});

	return true;
});

const validateAttachmentsFields = (attachmentField) => {
	check(attachmentField, objectMaybeIncluding({
		short: Boolean,
		title: String,
		value: Match.OneOf(String, Match.Integer, Boolean),
	}));

	if (typeof attachmentField.value !== 'undefined') {
		attachmentField.value = String(attachmentField.value);
	}

};

const validateAttachmentsActions = (attachmentActions) => {
	check(attachmentActions, objectMaybeIncluding({
		type: String,
		text: String,
		url: String,
		image_url: String,
		is_webview: Boolean,
		webview_height_ratio: String,
		msg: String,
		msg_in_chat_window: Boolean,
	}));
};

const validateAttachment = (attachment) => {
	check(attachment, objectMaybeIncluding({
		color: String,
		text: String,
		ts: Match.OneOf(String, Match.Integer),
		thumb_url: String,
		button_alignment: String,
		actions: [Match.Any],
		message_link: String,
		collapsed: Boolean,
		author_name: String,
		author_link: String,
		author_icon: String,
		title: String,
		title_link: String,
		title_link_download: Boolean,
		image_dimensions: Object,
		image_url: String,
		image_preview: String,
		image_type: String,
		image_size: Number,
		audio_url: String,
		audio_type: String,
		audio_size: Number,
		video_url: String,
		video_type: String,
		video_size: Number,
		fields: [Match.Any],
	}));

	if (attachment.fields && attachment.fields.length) {
		attachment.fields.map(validateAttachmentsFields);
	}

	if (attachment.actions && attachment.actions.length) {
		attachment.actions.map(validateAttachmentsActions);
	}
};

const validateBodyAttachments = (attachments) => attachments.map(validateAttachment);

export const sendMessage = function(user, message, room, upsert = false) {
	if (!user || !message || !room._id) {
		return false;
	}

	check(message, objectMaybeIncluding({
		_id: String,
		msg: String,
		text: String,
		alias: String,
		emoji: String,
		avatar: String,
		attachments: [Match.Any],
	}));

	if (Array.isArray(message.attachments) && message.attachments.length) {
		validateBodyAttachments(message.attachments);
	}

	if (!message.ts) {
		message.ts = new Date();
	}
	const { _id, username, name } = user;
	message.u = {
		_id,
		username,
		name,
	};
	message.rid = room._id;

	if (!Match.test(message.msg, String)) {
		message.msg = '';
	}

	if (message.ts == null) {
		message.ts = new Date();
	}

	if (settings.get('Message_Read_Receipt_Enabled')) {
		message.unread = true;
	}

	// For the Rocket.Chat Apps :)
	if (message && Apps && Apps.isLoaded()) {
		const prevent = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentPrevent', message));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-sending', 'A Rocket.Chat App prevented the message sending.');
		}

		let result;
		result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentExtend', message));
		result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentModify', result));

		if (typeof result === 'object') {
			message = Object.assign(message, result);
		}
	}

	if (message.parseUrls !== false) {
		message.html = message.msg;
		message = Markdown.code(message);

		const urls = message.html.match(/([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\(\)\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g);
		if (urls) {
			message.urls = urls.map((url) => ({ url }));
		}

		message = Markdown.mountTokensBack(message, false);
		message.msg = message.html;
		delete message.html;
		delete message.tokens;
	}

	message = callbacks.run('beforeSaveMessage', message, room);
	if (message) {
		if (message._id && upsert) {
			const { _id } = message;
			delete message._id;
			Messages.upsert({
				_id,
				'u._id': message.u._id,
			}, message);
			message._id = _id;
		} else {
			message._id = Messages.insert(message);
		}

		if (Apps && Apps.isLoaded()) {
			// This returns a promise, but it won't mutate anything about the message
			// so, we don't really care if it is successful or fails
			Apps.getBridges().getListenerBridge().messageEvent('IPostMessageSent', message);
		}

		/*
		Defer other updates as their return is not interesting to the user
		*/
		// Execute all callbacks
		Meteor.defer(() => callbacks.run('afterSaveMessage', message, room, user._id));
		return message;
	}
};
