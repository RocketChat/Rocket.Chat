import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../settings';

/**
 * This function returns a string ready to be shown in the notification
 *
 * @param {object} message the message to be parsed
 */
export function parseMessageTextPerUser(messageText, message, receiver) {
	const lng = receiver.language || settings.get('Language') || 'en';

	if (!message.msg && message.attachments && message.attachments[0]) {
		return message.attachments[0].image_type ? TAPi18n.__('User_uploaded_image', { lng }) : TAPi18n.__('User_uploaded_file', { lng });
	}

	if (message.msg && message.t === 'e2e') {
		return TAPi18n.__('Encrypted_message', { lng });
	}

	// perform processing required before sending message as notification such as markdown filtering
	return callbacks.run('renderNotification', messageText);
}

/**
 * Replaces @username with full name
 *
 * @param {string} message The message to replace
 * @param {object[]} mentions Array of mentions used to make replacements
 *
 * @returns {string}
 */
export function replaceMentionedUsernamesWithFullNames(message, mentions) {
	if (!mentions || !mentions.length) {
		return message;
	}
	mentions.forEach((mention) => {
		if (mention.name) {
			message = message.replace(new RegExp(escapeRegExp(`@${mention.username}`), 'g'), mention.name);
		}
	});
	return message;
}

/**
 * Checks if a message contains a user highlight
 *
 * @param {string} message
 * @param {array|undefined} highlights
 *
 * @returns {boolean}
 */
export function messageContainsHighlight(message, highlights) {
	if (!highlights || highlights.length === 0) {
		return false;
	}

	return highlights.some(function (highlight) {
		const regexp = new RegExp(escapeRegExp(highlight), 'i');
		return regexp.test(message.msg);
	});
}

export function callJoinRoom(userId, rid) {
	return new Promise((resolve, reject) => {
		Meteor.runAsUser(userId, () =>
			Meteor.call('joinRoom', rid, (error, result) => {
				if (error) {
					return reject(error);
				}
				return resolve(result);
			}),
		);
	});
}
