import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { MessageTypes } from '../../../../app/ui-utils';

MessageTypes.registerType({
	id: 'livechat_priority_history',
	system: true,
	message: 'New_chat_priority',
	data(message) {
		if (!message.priorityData) {
			return;
		}
		const {
			definedBy: { username },
			priority: { name = null } = {},
		} = message.priorityData;
		return {
			user: username,
			priority: name || TAPi18n.__('Without_priority'),
		};
	},
});
