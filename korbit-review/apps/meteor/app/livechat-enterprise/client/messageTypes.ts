import type { IMessage } from '@rocket.chat/core-typings';

import { MessageTypes } from '../../ui-utils/client';
import { t } from '../../utils/lib/i18n';

MessageTypes.registerType({
	id: 'livechat_transfer_history_fallback',
	system: true,
	message: 'New_chat_transfer_fallback',
	data(message: any) {
		if (!message.transferData) {
			return {
				fallback: 'SHOULD_NEVER_HAPPEN',
			};
		}
		const from = message.transferData.prevDepartment;
		const to = message.transferData.department.name;

		return {
			fallback: t('Livechat_transfer_failed_fallback', { from, to }),
		};
	},
});

MessageTypes.registerType({
	id: 'omnichannel_priority_change_history',
	system: true,
	message: 'omnichannel_priority_change_history',
	data(message: IMessage): Record<string, string> {
		if (!message.priorityData) {
			return {
				user: t('Unknown_User'),
				priority: t('Without_priority'),
			};
		}
		const {
			definedBy: { username },
			priority: { name = null, i18n } = {},
		} = message.priorityData;

		return {
			user: username || t('Unknown_User'),
			priority: name || (i18n && t(i18n)) || t('Unprioritized'),
		};
	},
});

MessageTypes.registerType({
	id: 'omnichannel_sla_change_history',
	system: true,
	message: 'omnichannel_sla_change_history',
	data(message: IMessage): Record<string, string> {
		if (!message.slaData) {
			return {
				user: t('Unknown_User'),
				priority: t('Without_SLA'),
			};
		}
		const {
			definedBy: { username },
			sla: { name = null } = {},
		} = message.slaData;

		return {
			user: username || t('Unknown_User'),
			sla: name || t('Without_SLA'),
		};
	},
});
