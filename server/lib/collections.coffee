@ChatMessage = new Meteor.Collection 'rocketchat_message'
@ChatRoom = new Meteor.Collection 'rocketchat_room'
@ChatSubscription = new Meteor.Collection 'rocketchat_subscription'
###
 contains AccessPermission objects defined by underlying data provider.  Does NOT
 contain classification AccessPermission objects because they are defined by the
 system environment. 
###
@AccessPermissions = new Mongo.Collection 'accessPermissions'
@MapReducedStatistics = new Mongo.Collection 'rocketchat_mr_statistics'
@Statistics = new Mongo.Collection 'rocketchat_statistics'
@ChatReports = new Meteor.Collection 'rocketchat_reports'