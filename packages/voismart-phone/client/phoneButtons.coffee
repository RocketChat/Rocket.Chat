Template.phoneButtons.onCreated ->
	this.tabBar = Template.currentData().tabBar

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

				t.tabBar.setTemplate "phone"
				t.tabBar.open()
				RocketChat.Phone.newCall(user.phoneextension, true)

	'click .start-phone-audiocall': (e, t) ->
		Meteor.call 'phoneFindUserByQ', {username: t.data.username}, (error, user) =>
			if error or !user?.phoneextension
				return
			else
				if user._id == Meteor.userId()
					return
				if !Meteor.isCordova
					t.tabBar.setTemplate "phone"
					t.tabBar.open()
					RocketChat.Phone.newCall(user.phoneextension, false)
				else
					window.open 'voismart://call/' + user.phoneextension, '_blank'
