import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { MessageTypes } from '../../ui-utils';

MessageTypes.registerType({
	id: 'livechat_navigation_history',
	system: true,
	message: 'New_visitor_navigation',
	data(message) {
		if (!message.navigation || !message.navigation.page) {
			return;
		}
		return {
			history: `${ (message.navigation.page.title ? `${ message.navigation.page.title } - ` : '') + message.navigation.page.location.href }`,
		};
	},
});

MessageTypes.registerType({
	id: 'livechat_transfer_history',
	system: true,
	message: 'New_chat_transfer',
	data(message) {
		if (!message.transferData) {
			return;
		}

		const { comment } = message.transferData;
		const commentLabel = comment && comment !== '' ? '_with_a_comment' : '';
		const from = message.transferData.transferredBy && (message.transferData.transferredBy.name || message.transferData.transferredBy.username);
		const transferTypes = {
			agent: () => TAPi18n.__(`Livechat_transfer_to_agent${ commentLabel }`, {
				from,
				to: message.transferData.transferredTo && (message.transferData.transferredTo.name || message.transferData.transferredTo.username),
				...comment && { comment },
			}),
			department: () => TAPi18n.__(`Livechat_transfer_to_department${ commentLabel }`, {
				from,
				to: message.transferData.nextDepartment && message.transferData.nextDepartment.name,
				...comment && { comment },
			}),
			queue: () => TAPi18n.__('Livechat_transfer_return_to_the_queue', {
				from,
			}),
		};
		return {
			transfer: transferTypes[message.transferData.scope](),
		};
	},
});

MessageTypes.registerType({
	id: 'livechat_video_call',
	system: true,
	message: 'New_videocall_request',
});
