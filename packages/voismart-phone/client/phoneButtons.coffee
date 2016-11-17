Template.phoneButtons.helpers
	phoneAvailable: ->
		return RocketChat.settings.get('Phone_Enabled')

	desktopPhone: ->
		return !Meteor.isCordova

	videoEnabled: ->
		cached = localStorage.getItem('MeteorPhoneConfig')
		phone_config = $.parseJSON(cached)
		if phone_config
			return phone_config['videoDevice']

Template.phoneButtons.events
	'click .stop-phone-call': (e, t) ->
		RocketChat.Phone.hangup()

	'click .start-phone-videocall': (e, t) ->
		Meteor.call 'phoneFindUserByQ', {username: t.data.username}, (error, user) =>
			if error or !user?.phoneextension
				return
			else
				if user._id == Meteor.userId()
					return

				RocketChat.TabBar.setTemplate "phone", ->
					RocketChat.Phone.newCall(user.phoneextension, true)

	'click .start-phone-audiocall': (e, t) ->
		Meteor.call 'phoneFindUserByQ', {username: t.data.username}, (error, user) =>
			if error or !user?.phoneextension
				return
			else
				if user._id == Meteor.userId()
					return
				if !Meteor.isCordova
					RocketChat.TabBar.setTemplate "phone", ->
						RocketChat.Phone.newCall(user.phoneextension, false)
				else
					window.open 'voismart://call/' + user.phoneextension, '_blank'
