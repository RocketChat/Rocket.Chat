import { Meteor } from 'meteor/meteor';
import { escapeHTML } from '@rocket.chat/string-helpers';
import type { IMessage } from '@rocket.chat/core-typings';

import { filterMarkdown } from '../../../markdown/lib/markdown';
import { Users } from '../../../models/client';
import { settings } from '../../../settings/client';
import { MentionsParser } from '../../../mentions/lib/MentionsParser';
import { emojiParser } from '../../../emoji/client/emojiParser.js';
import { shouldUseRealName } from '../../../utils/lib/shouldUseRealName';

export function normalizeThreadTitle({ ...message }: Readonly<IMessage>) {
	if (message.msg) {
		const filteredMessage = filterMarkdown(escapeHTML(message.msg));
		if (!message.channels && !message.mentions) {
			return filteredMessage;
		}
		const defaultMessagesLayout = settings.get('Accounts_Default_User_Preferences_messagesLayout');
		const uid = Meteor.userId();
		const user = uid ? Users.findOne(uid, { fields: { username: 1, settings: 1 } }) : null;
		const me = uid && user?.username;
		const pattern = settings.get('UTF8_User_Names_Validation');
		const useRealName = shouldUseRealName(defaultMessagesLayout, user);

		const instance = new MentionsParser({
			pattern: () => pattern,
			useRealName: () => useRealName,
			me: () => me,
			userTemplate: ({ label }) => `<strong> ${label} </strong>`,
			roomTemplate: ({ prefix, mention }) => `${prefix}<strong> ${mention} </strong>`,
		});
		const { html } = emojiParser({ html: filteredMessage });
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
