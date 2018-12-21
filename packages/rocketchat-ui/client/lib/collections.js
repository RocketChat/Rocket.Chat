import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

ChatMessage = new Mongo.Collection(null);
export const CachedChatRoom = new RocketChat.CachedCollection({ name: 'rooms' });
ChatRoom = CachedChatRoom.collection;

CachedChatSubscription = new RocketChat.CachedCollection({ name: 'subscriptions' });
ChatSubscription = CachedChatSubscription.collection;
UserRoles = new Mongo.Collection(null);
RoomRoles = new Mongo.Collection(null);
this.UserAndRoom = new Mongo.Collection(null);
this.CachedChannelList = new Mongo.Collection(null);
this.CachedUserList = new Mongo.Collection(null);

RocketChat.models.Users = _.extend({}, RocketChat.models.Users, Meteor.users);
RocketChat.models.Subscriptions = _.extend({}, RocketChat.models.Subscriptions, ChatSubscription);
RocketChat.models.Rooms = _.extend({}, RocketChat.models.Rooms, ChatRoom);
RocketChat.models.Messages = _.extend({}, RocketChat.models.Messages, ChatMessage);

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId() && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
			CachedChatRoom.init();
			CachedChatSubscription.ready.set(true);
		}
	});
});
