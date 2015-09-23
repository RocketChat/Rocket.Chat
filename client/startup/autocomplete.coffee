Meteor.startup ->

  Meteor.call 'getTotalChannels', (error, result) ->
    if error
      return Errors.throw error.reason

    # @todo: create settings for limit?
    if result <= 200
      Meteor.call 'channelsList', (chError, channels) ->
        if chError
          return Errors.throw chError.reason

        CachedChannelList.insert(channel) for channel in channels.channels
