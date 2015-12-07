Meteor.methods
  getTotalChannels: ->
    if not Meteor.userId()
      throw new Meteor.Error 'invalid-user', '[methods] getTotalChannels -> Invalid user'

    console.log '[methods] getTotalChannels -> '.green, 'userId:', Meteor.userId()
    return RocketChat.models.Rooms.find({ t: 'c' }).count()
