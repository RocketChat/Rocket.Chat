import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

this.ChatMessage = new Mongo.Collection(null);
this.CachedChatRoom = new RocketChat.CachedCollection({ name: 'rooms' });
ChatRoom = this.CachedChatRoom.collection;

this.CachedChatSubscription = new RocketChat.CachedCollection({ name: 'subscriptions' });
ChatSubscription = this.CachedChatSubscription.collection; //eslint-disable-line
this.UserRoles = new Mongo.Collection(null);
RoomRoles = new Mongo.Collection(null); //eslint-disable-line
this.UserAndRoom = new Mongo.Collection(null);
this.CachedChannelList = new Mongo.Collection(null);
this.CachedUserList = new Mongo.Collection(null);

RocketChat.models.Users = _.extend({}, RocketChat.models.Users, Meteor.users);
RocketChat.models.Subscriptions = _.extend({}, RocketChat.models.Subscriptions, ChatSubscription); //eslint-disable-line
RocketChat.models.Rooms = _.extend({}, RocketChat.models.Rooms, ChatRoom);
RocketChat.models.Messages = _.extend({}, RocketChat.models.Messages, this.ChatMessage);

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId() && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
			this.CachedChatRoom.init();
			this.CachedChatSubscription.ready.set(true);
		}
	});
});
