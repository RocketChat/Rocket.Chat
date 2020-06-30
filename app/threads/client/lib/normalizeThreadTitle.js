import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { filterMarkdown } from '../../../markdown/lib/markdown';
import { Users } from '../../../models/client';
import { settings } from '../../../settings/client';
import { MentionsParser } from '../../../mentions/lib/MentionsParser';

export const normalizeThreadTitle = ({ ...message }) => {
	if (message.msg) {
		const filteredMessage = filterMarkdown(message.msg);
		if (!message.channels && !message.mentions) {
			return filteredMessage;
		}
		const uid = Meteor.userId();
		const me = uid && (Users.findOne(uid, { fields: { username: 1 } }) || {}).username;
		const pattern = settings.get('UTF8_Names_Validation');
		const useRealName = settings.get('UI_Use_Real_Name');

		const instance = new MentionsParser({
			pattern: () => pattern,
			useRealName: () => useRealName,
			me: () => me,
			userTemplate: ({ label }) => `<strong> ${ label } </strong>`,
			roomTemplate: ({ channel }) => `<strong> ${ channel } </strong>`,
		});

		return instance.parse({ ...message, msg: filteredMessage, html: filteredMessage }).html;
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment && attachment.description) {
			return s.escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return s.escapeHTML(attachment.title);
		}
	}
};
