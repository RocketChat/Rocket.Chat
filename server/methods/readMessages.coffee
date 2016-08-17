Meteor.methods
	readMessages: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'readMessages' }

		subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId rid, Meteor.userId()
		messages = RocketChat.models.Messages.findVisibleByRoomIdAfterTimestamp( rid, subscription.ls, { sort: { ts: 1 }}).fetch()
		for msg, i in messages
			exists = 0
			#console.log "user : " + Meteor.user().username + " reader : " + msg.reader
			if msg.reader
        for d, i in msg.reader
          if d.userid == Meteor.userId()
            exists = 1
        if !exists
          msg.reader.push {userid:Meteor.userId(), username:Meteor.user().username, readtime: new Date}
          #console.log msg.reader
          err = RocketChat.models.Messages.setMessageReader msg._id, msg.reader
          #console.log err
			else
        msg.reader = [{userid:Meteor.userId(), username:Meteor.user().username, readtime: new Date}]
        err = RocketChat.models.Messages.setMessageReader msg._id, msg.reader

		RocketChat.models.Subscriptions.setAsReadByRoomIdAndUserId rid, Meteor.userId()
