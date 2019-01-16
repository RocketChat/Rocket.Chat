import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { settings } from 'meteor/rocketchat:settings';
import {
	ChatMessage as chatMessage,
	CachedChatRoom as cachedChatRoom,
	ChatRoom as chatRoom,
	CachedChatSubscription as cachedChatSubscription,
	ChatSubscription as chatSubscription,
	UserRoles as userRoles,
	RoomRoles as roomRoles,
	UserAndRoom as userAndRoom,
	CachedChannelList as cachedChannelList,
	CachedUserList as cachedUserList,
} from 'meteor/rocketchat:models';

ChatMessage = chatMessage;
export const CachedChatRoom = cachedChatRoom;
ChatRoom = chatRoom;

CachedChatSubscription = cachedChatSubscription;
ChatSubscription = chatSubscription;
UserRoles = userRoles;
RoomRoles = roomRoles;
this.UserAndRoom = userAndRoom;
this.CachedChannelList = cachedChannelList;
this.CachedUserList = cachedUserList;

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') === true) {
			CachedChatRoom.init();
			CachedChatSubscription.ready.set(true);
		}
	});
});
