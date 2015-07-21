@ChatMessage = new Meteor.Collection 'data.ChatMessage'
@ChatRoom = new Meteor.Collection 'data.ChatRoom'
@ChatSubscription = new Meteor.Collection 'data.ChatSubscription'
@ChatTyping = new Meteor.Collection 'data.ChatTyping'
###
 contains AccessPermission objects defined by underlying data provider.  Does NOT
 contain classification AccessPermission objects because they are defined by the
 system environment. 
###
@AccessPermissions = new Mongo.Collection 'accessPermissions'