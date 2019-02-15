import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.MessageTypes.registerType({
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

RocketChat.MessageTypes.registerType({
	id: 'livechat_video_call',
	system: true,
	message: 'New_videocall_request',
});

RocketChat.actionLinks.register('createLivechatCall', function(message, params, instance) {
	if (Meteor.isClient) {
		instance.tabBar.open('video');
	}
});

RocketChat.actionLinks.register('denyLivechatCall', function(message/* , params*/) {
	if (Meteor.isServer) {
		const user = Meteor.user();

		RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('command', message.rid, 'endCall', user);
		RocketChat.Notifications.notifyRoom(message.rid, 'deleteMessage', { _id: message._id });

		const language = user.language || RocketChat.settings.get('Language') || 'en';

		RocketChat.Livechat.closeRoom({
			user,
			room: RocketChat.models.Rooms.findOneById(message.rid),
			comment: TAPi18n.__('Videocall_declined', { lng: language }),
		});
		Meteor.defer(() => {
			RocketChat.models.Messages.setHiddenById(message._id);
		});
	}
});
