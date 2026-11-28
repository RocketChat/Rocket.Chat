import { api } from '@rocket.chat/core-services';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { Messages, Users } from '@rocket.chat/models';
import moment from 'moment';

import { callbacks } from '../../lib/callbacks';
import { i18n } from '../../lib/i18n';
import { formatMentionedUsers } from '../../lib/messages/formatMentionedUsers';
import type { HistoryCheckedMessage } from '../../lib/messages/historyVisibility';
import { getMembersWithoutAccessToMessage, historyCheckedMessageProjection } from '../../lib/messages/historyVisibility';

const APP_ID = 'mention-core';

callbacks.add(
	'afterSaveMessage',
	async (message) => {
		// Same window as the mention notifications: edits and imports don't prompt
		if (
			!message.tmid ||
			isEditedMessage(message) ||
			(message.ts && Math.abs(moment(message.ts).diff(moment())) > 60000) ||
			!message.mentions
		) {
			return message;
		}

		const mentions = message.mentions.filter(({ _id, type }) => _id !== 'all' && _id !== 'here' && type !== 'team');
		if (!mentions.length) {
			return message;
		}

		const threadRoot = await Messages.findOneById<HistoryCheckedMessage>(message.tmid, { projection: historyCheckedMessageProjection });
		if (!threadRoot) {
			return message;
		}

		const membersWithoutAccess = await getMembersWithoutAccessToMessage(threadRoot);
		const mentionsWithoutAccess = mentions.filter(({ _id }) => membersWithoutAccess.has(_id));
		if (!mentionsWithoutAccess.length) {
			return message;
		}

		const { language: lng } = (await Users.findOneById(message.u._id, { projection: { language: 1 } })) || {};
		const value = JSON.stringify(mentionsWithoutAccess);

		void api.broadcast('notify.ephemeralMessage', message.u._id, message.rid, {
			msg: '',
			mentions: mentionsWithoutAccess,
			tmid: message.tmid,
			blocks: [
				{
					appId: APP_ID,
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: i18n.t('Mentioned_users_cannot_see_this_thread', { mentions: formatMentionedUsers(mentionsWithoutAccess), lng }),
					},
				},
				{
					type: 'actions',
					appId: APP_ID,
					elements: [
						{
							type: 'button',
							appId: APP_ID,
							blockId: message._id,
							value,
							actionId: 'give-thread-access',
							text: { type: 'plain_text', text: i18n.t('Give_thread_access', { lng }) },
						},
						{
							type: 'button',
							appId: APP_ID,
							blockId: message._id,
							value,
							actionId: 'dismiss-thread-access',
							text: { type: 'plain_text', text: i18n.t('Do_nothing', { lng }) },
						},
					],
				},
			],
			private: true,
		});

		return message;
	},
	callbacks.priority.LOW,
	'mention-user-without-thread-access',
);
