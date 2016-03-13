Meteor.methods
  openRoom: (rid) ->
    if not Meteor.userId()
      throw new Meteor.Error 'invalid-user', '[methods] openRoom -> Invalid user'

    RocketChat.models.Subscriptions.openByRoomIdAndUserId rid, Meteor.userId()
