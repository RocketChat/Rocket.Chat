import { Match, check } from 'meteor/check';
import { parser } from '@rocket.chat/message-parser';

import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { Tasks } from '../../../models';
// import { Apps } from '../../../apps/server';
import { isURL, isRelativeURL } from '../../../utils/lib/isURL';
import { FileUpload } from '../../../file-upload/server';
import { hasPermission } from '../../../authorization/server';
import { parseUrlsInTask } from './parseUrlsInTask';

const { DISABLE_MESSAGE_PARSER = 'false' } = process.env;

/**
 * IMPORTANT
 *
 * This validator prevents malicious href values
 * intending to run arbitrary js code in anchor tags.
 * You should use it whenever the value you're checking
 * is going to be rendered in the href attribute of a
 * link.
 */
const ValidFullURLParam = Match.Where((value) => {
	check(value, String);

	if (!isURL(value) && !value.startsWith(FileUpload.getPath())) {
		throw new Error('Invalid href value provided');
	}

	if (/^javascript:/i.test(value)) {
		throw new Error('Invalid href value provided');
	}

	return true;
});

const ValidPartialURLParam = Match.Where((value) => {
	check(value, String);

	if (!isRelativeURL(value) && !isURL(value) && !value.startsWith(FileUpload.getPath())) {
		throw new Error('Invalid href value provided');
	}

	if (/^javascript:/i.test(value)) {
		throw new Error('Invalid href value provided');
	}

	return true;
});

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
		value: Match.OneOf(String, Number, Boolean),
	}));

	if (typeof attachmentField.value !== 'undefined') {
		attachmentField.value = String(attachmentField.value);
	}
};

const validateAttachmentsActions = (attachmentActions) => {
	check(attachmentActions, objectMaybeIncluding({
		type: String,
		text: String,
		url: ValidFullURLParam,
		image_url: ValidFullURLParam,
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
		ts: Match.OneOf(String, Number),
		thumb_url: ValidFullURLParam,
		button_alignment: String,
		actions: [Match.Any],
		message_link: ValidFullURLParam,
		collapsed: Boolean,
		author_name: String,
		author_link: ValidFullURLParam,
		author_icon: ValidFullURLParam,
		title: String,
		title_link: ValidFullURLParam,
		title_link_download: Boolean,
		image_dimensions: Object,
		image_url: ValidFullURLParam,
		image_preview: String,
		image_type: String,
		image_size: Number,
		audio_url: ValidFullURLParam,
		audio_type: String,
		audio_size: Number,
		video_url: ValidFullURLParam,
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

const validateTask = (task, room, user) => {
	check(task, objectMaybeIncluding({
		_id: String,
		title: String,
		taskDescription: String,
		taskStatus: String,
		text: String,
		alias: String,
		emoji: String,
		tmid: String,
		tshow: Boolean,
		avatar: ValidPartialURLParam,
		attachments: [Match.Any],
		blocks: [Match.Any],
	}));

	if (task.alias || task.avatar) {
		const isLiveChatGuest = !task.avatar && user.token && user.token === room.v?.token;

		if (!isLiveChatGuest && !hasPermission(user._id, 'message-impersonate', room._id)) {
			throw new Error('Not enough permission');
		}
	}

	if (Array.isArray(task.attachments) && task.attachments.length) {
		validateBodyAttachments(task.attachments);
	}
};

export const sendTask = function(user, task, room, upsert = false) {
	if (!user || !task || !room._id) {
		return false;
	}

	validateTask(task, room, user);

	if (!task.ts) {
		task.ts = new Date();
	}

	if (task.tshow !== true) {
		delete task.tshow;
	}

	const { _id, username, name } = user;
	task.u = {
		_id,
		username,
		name,
	};
	task.rid = room._id;

	if (!Match.test(task.title, String)) {
		task.title = '';
	}

	if (task.ts == null) {
		task.ts = new Date();
	}

	if (settings.get('Message_Read_Receipt_Enabled')) {
		task.unread = true;
	}

	// For the Rocket.Chat Apps :)
	// if (Apps && Apps.isLoaded()) {
	// 	const prevent = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentPrevent', message));
	// 	if (prevent) {
	// 		if (settings.get('Apps_Framework_Development_Mode')) {
	// 			console.log('A Rocket.Chat App prevented the message sending.', message);
	// 		}

	// 		return;
	// 	}

	// 	let result;
	// 	result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentExtend', message));
	// 	result = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageSentModify', result));

	// 	if (typeof result === 'object') {
	// 		message = Object.assign(message, result);

	// 		// Some app may have inserted malicious/invalid values in the message, let's check it again
	// 		validateMessage(message, room, user);
	// 	}
	// }

	parseUrlsInTask(task);

	task = callbacks.run('beforeSaveMessage', task, room);
	try {
		if (task.title && DISABLE_MESSAGE_PARSER !== 'true') {
			task.md = parser(task.title);
		}
	} catch (e) {
		console.log(e); // errors logged while the parser is at experimental stage
	}
	if (task) {
		if (task._id && upsert) {
			const { _id } = task;
			delete task._id;
			Tasks.upsert({
				_id,
				'u._id': task.u._id,
			}, task);
			task._id = _id;
		} else {
			const messageAlreadyExists = task._id && Tasks.findOneById(task._id, { fields: { _id: 1 } });
			if (messageAlreadyExists) {
				return;
			}
			task._id = Tasks.insert(task);
		}

		// if (Apps && Apps.isLoaded()) {
		// 	// This returns a promise, but it won't mutate anything about the message
		// 	// so, we don't really care if it is successful or fails
		// 	Apps.getBridges().getListenerBridge().messageEvent('IPostMessageSent', message);
		// }

		/*
		Defer other updates as their return is not interesting to the user
		*/
		// Execute all callbacks
		callbacks.runAsync('afterSaveTask', task, room, user._id);
		return task;
	}
};
