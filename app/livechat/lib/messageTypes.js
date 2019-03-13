import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { MessageTypes } from '/app/ui-utils';
import { actionLinks } from '/app/action-links';
import { Notifications } from '/app/notifications';
import { Messages, Rooms } from '/app/models';
import { settings } from '/app/settings';
import { Livechat } from 'meteor/rocketchat:livechat';

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
			room: Rooms.findOneById(message.rid),
			comment: TAPi18n.__('Videocall_declined', { lng: language }),
		});
		Meteor.defer(() => {
			Messages.setHiddenById(message._id);
		});
	}
});
