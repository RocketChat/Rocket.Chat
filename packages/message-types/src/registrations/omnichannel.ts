import type { IOmnichannelSystemMessage } from '@rocket.chat/core-typings';

import type { MessageTypes } from '../MessageTypes';

export default (instance: MessageTypes) => {
	instance.registerType({
		id: 'omnichannel_placed_chat_on_hold',
		system: true,
		text: (t, message: IOmnichannelSystemMessage) =>
			t('Omnichannel_placed_chat_on_hold', { comment: message.comment ? message.comment : t('No_comment_provided') }),
	});

	instance.registerType({
		id: 'omnichannel_on_hold_chat_resumed',
		system: true,
		text: (t, message: IOmnichannelSystemMessage) =>
			t('Omnichannel_on_hold_chat_resumed', { comment: message.comment ? message.comment : t('No_comment_provided') }),
	});

	instance.registerType({
		id: 'omnichannel_priority_change_history',
		system: true,
		text: (t, message) => {
			if (!message.priorityData) {
				return t('omnichannel_priority_change_history', {
					user: t('Unknown_User'),
					priority: t('Without_priority'),
				});
			}
			const {
				definedBy: { username },
				priority: { name = null, i18n } = {},
			} = message.priorityData;

			return t('omnichannel_priority_change_history', {
				user: username || t('Unknown_User'),
				priority: name || (i18n && t(i18n)) || t('Unprioritized'),
			});
		},
	});

	instance.registerType({
		id: 'omnichannel_sla_change_history',
		system: true,
		text: (t, message) => {
			if (!message.slaData) {
				return t('omnichannel_sla_change_history', {
					user: t('Unknown_User'),
					priority: t('Without_SLA'),
				});
			}
			const {
				definedBy: { username },
				sla: { name = null } = {},
			} = message.slaData;

			return t('omnichannel_sla_change_history', {
				user: username || t('Unknown_User'),
				sla: name || t('Without_SLA'),
			});
		},
	});
};
