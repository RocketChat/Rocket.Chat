Meteor.startup ->
	Tracker.autorun ->
		enabled = RocketChat.settings.get('Webc_Enabled')
		if enabled is true
			RocketChat.TabBar.addButton({
				groups: ['channel', 'privategroup'],
				id: 'webcollaboration',
				i18nTitle: 'WebCollaboration',
				icon: 'icon-share',
				template: 'webCollaboration',
				order: 10
			})

			if Meteor.userId()
				RocketChat.Notifications.onUser 'webconf', (msg) ->
					msg.u =
						username: 'ConferenceBot'
					msg.private = true
					ChatMessage.upsert { _id: msg._id }, msg


Template.webCollaboration.events
	'click #webc-audioconf': (e, t) ->
		enabled = RocketChat.settings.get('Webc_Enabled')
		if enabled is false
			return

		rnd = Math.floor((Math.random() * 10000) + 10000)
		nr = "*73*#{rnd}"
		rid = Session.get('openedRoom')
		msg = "AudioConference request " + nr
		isCordova = Meteor.isCordova
		Meteor.call 'phoneNumberOffer', rid, nr, msg, isCordova, (error, result) ->
			if !error
				RocketChat.TabBar.closeFlex()

	'click #webc_tryme': (e, t) ->
		enabled = RocketChat.settings.get('Webc_Enabled')
		if enabled is false
			return

		Meteor.call 'webcRequest', Session.get('openedRoom'), (error, result) ->
			if not result?
				reason = "500"
				if error and error.reason
					reason = error.reason
				msg = {
					_id: Random.id()
					rid: Session.get('openedRoom')
					ts: new Date
					u: username: 'ConferenceBot'
					private: true
					msg: "Error in WebCollabRequest (" + reason + ")"
				}
				ChatMessage.upsert { _id: msg._id }, msg
			else
				RocketChat.TabBar.closeFlex()

