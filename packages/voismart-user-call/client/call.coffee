Template.room.events
	'dblclick .user-card-message': (e, instance) ->
		e.preventDefault()
		e.stopPropagation()

		if RocketChat.settings.get('Phone_Enabled') and !Meteor.isCordova
			user = Meteor.users.findOne(this._arguments[1].u)
			if !user or !user.phoneextension
				return

			if user._id == Meteor.userId()
				return

			RocketChat.TabBar.setTemplate "phone", ->
				RocketChat.Phone.newCall(user.phoneextension, true)
