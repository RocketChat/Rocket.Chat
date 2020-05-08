import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Livechat } from 'meteor/rocketchat:livechat';

import { MessageTypes } from '../../ui-utils';
import { actionLinks } from '../../action-links';
import { Notifications } from '../../notifications';
import { Messages, LivechatRooms } from '../../models';
import { settings } from '../../settings';

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

actionLinks.register('createLivechatCall', function(message, params, instance) {
	if (Meteor.isClient) {
		instance.tabBar.open('video');
	}
});

actionLinks.register('denyLivechatCall', function(message/* , params*/) {
	if (Meteor.isServer) {
		const user = Meteor.user();

		Messages.createWithTypeRoomIdMessageAndUser('command', message.rid, 'endCall', user);
		Notifications.notifyRoom(message.rid, 'deleteMessage', { _id: message._id });

		const language = user.language || settings.get('Language') || 'en';

		Livechat.closeRoom({
			user,
			room: LivechatRooms.findOneById(message.rid),
			comment: TAPi18n.__('Videocall_declined', { lng: language }),
		});
		Meteor.defer(() => {
			Messages.setHiddenById(message._id);
		});
	}
});
