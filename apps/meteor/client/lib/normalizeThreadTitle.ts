import type { IMessage } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';

import { emojiParser } from '../../app/emoji/client/emojiParser';
import { filterMarkdown } from '../../app/markdown/lib/markdown';
import { MentionsParser } from '../../app/mentions/lib/MentionsParser';
import { Users } from '../../app/models/client';
import { settings } from '../../app/settings/client';

export function normalizeThreadTitle({ ...message }: Readonly<IMessage>) {
	if (message.msg) {
		const filteredMessage = filterMarkdown(escapeHTML(message.msg));
		if (!message.channels && !message.mentions) {
			return filteredMessage;
		}
		const uid = Meteor.userId();
		const me = (uid && Users.findOne(uid, { fields: { username: 1 } })?.username) || '';
		const pattern = settings.get('UTF8_User_Names_Validation');
		const useRealName = settings.get('UI_Use_Real_Name');

		const instance = new MentionsParser({
			pattern: () => pattern,
			useRealName: () => useRealName,
			me: () => me,
			userTemplate: ({ label }) => `<strong> ${label} </strong>`,
			roomTemplate: ({ prefix, mention }) => `${prefix}<strong> ${mention} </strong>`,
		});
		const html = emojiParser(filteredMessage);
		return instance.parse({ ...message, msg: filteredMessage, html }).html;
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment?.description) {
			return escapeHTML(attachment.description);
		}

		if (attachment?.title) {
			return escapeHTML(attachment.title);
		}
	}
}
