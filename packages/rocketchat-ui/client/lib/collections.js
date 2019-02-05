import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { settings } from 'meteor/rocketchat:settings';
import {
	ChatMessage,
	CachedChatRoom,
	ChatRoom,
	CachedChatSubscription,
	ChatSubscription,
	UserRoles,
	RoomRoles,
	UserAndRoom,
	CachedChannelList,
	CachedUserList,
} from 'meteor/rocketchat:models';

export {
	ChatMessage,
	CachedChatRoom,
	ChatRoom,
	CachedChatSubscription,
	ChatSubscription,
	UserRoles,
	RoomRoles,
	UserAndRoom,
	CachedChannelList,
	CachedUserList,
};

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') === true) {
			CachedChatRoom.init();
			CachedChatSubscription.ready.set(true);
		}
	});
});
