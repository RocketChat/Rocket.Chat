import s from 'underscore.string';

/**
* This function returns a string ready to be shown in the notification
*
* @param {object} message the message to be parsed
*/
export function parseMessageText(message, userId) {
	const user = RocketChat.models.Users.findOneById(userId);
	const lng = user && user.language || RocketChat.settings.get('language') || 'en';

	if (!message.msg && message.attachments && message.attachments[0]) {
		message.msg = message.attachments[0].image_type ? TAPi18n.__('User_uploaded_image', {lng}) : TAPi18n.__('User_uploaded_file', {lng});
	}
	message.msg = RocketChat.callbacks.run('beforeNotifyUser', message.msg);

	return message.msg;
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
	if (! highlights || highlights.length === 0) { return false; }

	return highlights.some(function(highlight) {
		const regexp = new RegExp(s.escapeRegExp(highlight), 'i');
		return regexp.test(message.msg);
	});
}

export function callJoinRoom(user, rid) {
	return new Promise((resolve, reject) => {
		Meteor.runAsUser(user._id, () => Meteor.call('joinRoom', rid, (error, result) => {
			if (error) {
				return reject(error);
			}
			return resolve(result);
		}));
	});
}
