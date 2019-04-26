import { Match, check } from 'meteor/check';
import { objectMaybeIncluding, ValidHref } from './validation';

export const AttachmentFields = Match.Where((attachmentField) => {
	check(attachmentField, objectMaybeIncluding({
		short: Boolean,
		title: String,
		value: Match.OneOf(String, Match.Integer, Boolean),
	}));

	if (typeof attachmentField.value !== 'undefined') {
		attachmentField.value = String(attachmentField.value);
	}

	return true;
});

export const AttachmentActions = objectMaybeIncluding({
	type: String,
	text: String,
	url: ValidHref,
	image_url: String,
	is_webview: Boolean,
	webview_height_ratio: String,
	msg: String,
	msg_in_chat_window: Boolean,
});

export const Attachment = objectMaybeIncluding({
	color: String,
	text: String,
	ts: Match.OneOf(String, Match.Integer),
	thumb_url: String,
	button_alignment: String,
	actions: [AttachmentActions],
	message_link: ValidHref,
	collapsed: Boolean,
	author_name: String,
	author_link: ValidHref,
	author_icon: String,
	title: String,
	title_link: ValidHref,
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
	fields: [AttachmentFields],
});
