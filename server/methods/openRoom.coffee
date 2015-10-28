Meteor.methods
  openRoom: (rid) ->
    if not Meteor.userId()
      throw new Meteor.Error 'invalid-user', '[methods] openRoom -> Invalid user'

    console.log '[methods] openRoom -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

    RocketChat.models.Subscriptions.openByRoomIdAndUserId rid, Meteor.userId()
