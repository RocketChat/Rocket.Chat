@ChatMessage = new Meteor.Collection null
@CachedChatRoom = new RocketChat.CachedCollection({ name: 'rooms' })
@ChatRoom = CachedChatRoom.collection

@CachedChatSubscription = new RocketChat.CachedCollection({ name: 'subscriptions' })
@ChatSubscription = CachedChatSubscription.collection
@UserRoles = new Mongo.Collection null
@RoomRoles = new Mongo.Collection null
@UserAndRoom = new Meteor.Collection null
@CachedChannelList = new Meteor.Collection null
@CachedUserList = new Meteor.Collection null

RocketChat.models.Users = _.extend {}, RocketChat.models.Users, Meteor.users
RocketChat.models.Subscriptions = _.extend {}, RocketChat.models.Subscriptions, @ChatSubscription
RocketChat.models.Rooms = _.extend {}, RocketChat.models.Rooms, @ChatRoom
RocketChat.models.Messages = _.extend {}, RocketChat.models.Messages, @ChatMessage
