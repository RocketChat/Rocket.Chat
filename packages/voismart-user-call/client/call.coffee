Template.room.events
	'dblclick .user-card-message': (e, instance) ->
		e.preventDefault()
		e.stopPropagation()

		if RocketChat.settings.get('Phone_Enabled') and !Meteor.isCordova
			console.log(this._arguments)
			Meteor.call 'phoneFindUserByQ', {username: this._arguments[1].u.username}, (error, user) =>
				if error or !user?.phoneextension
					return
				else
					if user._id == Meteor.userId()
						return
				tabBar =  Template.instance().tabBar
				tabBar.setTemplate "phone"
				RocketChat.Phone.newCall(user.phoneextension, true)
