this.ChatMessage = new Meteor.Collection(null);
this.CachedChatRoom = new RocketChat.CachedCollection({ name: 'rooms' });
this.ChatRoom = this.CachedChatRoom.collection;

this.CachedChatSubscription = new RocketChat.CachedCollection({ name: 'subscriptions' });
this.ChatSubscription = this.CachedChatSubscription.collection;
this.UserRoles = new Mongo.Collection(null);
this.RoomRoles = new Mongo.Collection(null);
this.UserAndRoom = new Meteor.Collection(null);
this.CachedChannelList = new Meteor.Collection(null);
this.CachedUserList = new Meteor.Collection(null);

RocketChat.models.Users = _.extend({}, RocketChat.models.Users, Meteor.users);
RocketChat.models.Subscriptions = _.extend({}, RocketChat.models.Subscriptions, this.ChatSubscription);
RocketChat.models.Rooms = _.extend({}, RocketChat.models.Rooms, this.ChatRoom);
RocketChat.models.Messages = _.extend({}, RocketChat.models.Messages, this.ChatMessage);
