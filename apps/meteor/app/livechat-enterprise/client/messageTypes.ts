import { MessageTypes } from '@rocket.chat/message-types';

MessageTypes.registerType({
	id: 'livechat_transfer_history_fallback',
	system: true,
	text: (t, message: any) => {
		if (!message.transferData) {
			return t('New_chat_transfer_fallback', { fallback: 'SHOULD_NEVER_HAPPEN' });
		}
		const from = message.transferData.prevDepartment;
		const to = message.transferData.department.name;

		return t('New_chat_transfer_fallback', { fallback: t('Livechat_transfer_failed_fallback', { from, to }) });
	},
});

MessageTypes.registerType({
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

MessageTypes.registerType({
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
