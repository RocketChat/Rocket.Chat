import { escapeHTML } from '@rocket.chat/string-helpers';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { filterMarkdown } from '../../../app/markdown/lib/markdown';

export const normalizeSidebarMessage = (message, t) => {
	if (message.t) {
		switch (message.t) {
			case 'uj':
				return TAPi18n.__('User_joined_channel');
			case 'ul':
				return TAPi18n.__('User_left');
			case 'ut':
				return TAPi18n.__('User_joined_conversation');
			case 'livechat-close':
				return TAPi18n.__('Conversation_finished');
			case 'livechat-started':
				return TAPi18n.__('Chat_started');
			case 'room-archived':
				return TAPi18n.__('This_room_has_been_archived_by__username_', {
					username: message.u.username,
				});
			case 'room-unarchived':
				return TAPi18n.__('This_room_has_been_unarchived_by__username_', {
					username: message.u.username,
				});
			case 'room_e2e_enabled':
				return TAPi18n.__('This_room_encryption_has_been_enabled_by__username_', {
					username: message.u.username,
				});
			case 'room_e2e_disabled':
				return TAPi18n.__('This_room_encryption_has_been_disabled_by__username_', {
					username: message.u.username,
				});
			case 'au':
				return TAPi18n.__('User_added_by', {
					user_added: message.msg,
					user_by: message.u.username,
				});
			case 'r':
				return TAPi18n.__('Room_name_changed', {
					room_name: message.msg,
					user_by: message.u.username,
				});
			case 'ru':
				return TAPi18n.__('User_removed_by', {
					user_removed: message.msg,
					user_by: message.u.username,
				});
			case 'wm':
				return TAPi18n.__('Welcome', {
					user: message.u.username,
				});
			case 'user-muted':
				return TAPi18n.__('User_muted_by', {
					user_muted: message.msg,
					user_by: message.u.username,
				});
			case 'user-unmuted':
				return TAPi18n.__('User_unmuted_by', {
					user_unmuted: message.msg,
					user_by: message.u.username,
				});
			case 'subscription-role-added':
				return TAPi18n.__('__username__was_set__role__by__user_by_', {
					username: message.msg,
					user_by: message.u.username,
					role: message.role,
				});
			case 'subscription-role-removed':
				return TAPi18n.__('__username__is_no_longer__role__defined_by__user_by_', {
					username: message.msg,
					user_by: message.u.username,
					role: message.role,
				});
		}
	}

	if (message.msg) {
		return escapeHTML(filterMarkdown(message.msg));
	}

	if (message.attachments) {
		const attachment = message.attachments.find(
			(attachment) => attachment.title || attachment.description,
		);

		if (attachment && attachment.description) {
			return escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return escapeHTML(attachment.title);
		}

		return t('Sent_an_attachment');
	}
};
