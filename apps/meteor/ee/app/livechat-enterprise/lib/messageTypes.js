import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { MessageTypes } from '../../../../app/ui-utils';

MessageTypes.registerType({
	id: 'livechat_priority_history',
	system: true,
	message: 'New_chat_priority',
	data(message) {
		if (!message.slaData) {
			return;
		}
		const {
			definedBy: { username },
			priority: { name: priorityName = null } = {},
			sla: { name: slaName = null } = {},
		} = message.slaData;
		return {
			user: username,
			priority: priorityName || slaName || TAPi18n.__('Without_priority'),
		};
	},
});
