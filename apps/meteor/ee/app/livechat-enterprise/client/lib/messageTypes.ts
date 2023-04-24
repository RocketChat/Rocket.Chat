import type { IMessage } from '@rocket.chat/core-typings';

import { MessageTypes } from '../../../../../app/ui-utils/client';
import { translationHelper } from '../../../../../client/lib/i18n/i18nHelper';

MessageTypes.registerType({
	id: 'omnichannel_priority_change_history',
	system: true,
	message: 'omnichannel_priority_change_history',
	data(message: IMessage): Record<string, string> {
		if (!message.priorityData) {
			return {
				user: translationHelper.t('Unknown_User'),
				priority: translationHelper.t('Without_priority'),
			};
		}
		const {
			definedBy: { username },
			priority: { name = null, i18n } = {},
		} = message.priorityData;

		return {
			user: username || translationHelper.t('Unknown_User'),
			priority: name || (i18n && translationHelper.t(i18n)) || translationHelper.t('Unprioritized'),
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
				user: translationHelper.t('Unknown_User'),
				priority: translationHelper.t('Without_SLA'),
			};
		}
		const {
			definedBy: { username },
			sla: { name = null } = {},
		} = message.slaData;

		return {
			user: username || translationHelper.t('Unknown_User'),
			sla: name || translationHelper.t('Without_SLA'),
		};
	},
});
