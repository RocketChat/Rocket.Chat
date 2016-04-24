Meteor.methods
  openRoom: (rid) ->
    if not Meteor.userId()
      throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'openRoom' }

    RocketChat.models.Subscriptions.openByRoomIdAndUserId rid, Meteor.userId()
