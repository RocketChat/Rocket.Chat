Template.phoneButtons.helpers
	phoneAvailable: ->
		return RocketChat.settings.get('Phone_Enabled')

	desktopPhone: ->
		return !Meteor.isCordova

Template.phoneButtons.events
	'click .stop-phone-call': (e, t) ->
		RocketChat.Phone.hangup()

	'click .start-phone-videocall': (e, t) ->
		u = t.data.username
		user = Meteor.users.findOne({username: u})
		if !user or !user.phoneextension
			return
		if user._id == Meteor.userId()
			return

		RocketChat.TabBar.setTemplate "phone", ->
			RocketChat.Phone.newCall(user.phoneextension, true)

	'click .start-phone-audiocall': (e, t) ->
		u = t.data.username
		user = Meteor.users.findOne({username: u})
		if !user or !user.phoneextension
			return
		if user._id == Meteor.userId()
			return

		if !Meteor.isCordova
			RocketChat.Phone.newCall(user.phoneextension, false)
		else
			window.open 'voismart://call/' + user.phoneextension, '_blank'
