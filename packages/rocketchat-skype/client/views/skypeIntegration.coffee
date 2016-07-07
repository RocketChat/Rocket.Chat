Template.skypeIntegration.helpers
	editing: (field) ->
		return Template.instance().editing.get() is field
	skypeLogin: ->
		Meteor.user().skypeLogin;
	users: ->
		usersWithSkype = []
		usersWithoutSkype = []
		skypeLogins = []
		onlineUsers = RoomManager.onlineUsers.get()
		roomUsernames = ChatRoom.findOne(this.rid)?.usernames or []

		for username in roomUsernames
			utcOffset = onlineUsers[username]?.utcOffset
			if utcOffset?
				if utcOffset > 0
					utcOffset = "+#{utcOffset}"

				utcOffset = "(UTC #{utcOffset})"

			user = RocketChat.models.Users.findOne({username: username})
			newUser =
				username: username
				status: onlineUsers[username]?.status
				utcOffset: utcOffset

			if user.skypeLogin?
				usersWithSkype.push newUser
				skypeLogins.push user.skypeLogin
			else
				usersWithoutSkype.push newUser

		usersWithSkype = _.sortBy usersWithSkype, 'username'
		usersWithoutSkype = _.sortBy usersWithoutSkype, 'username'

		skypeCall = skypeLogins.join ';'

		ret =
			_id: this.rid
			usersWithSkype: usersWithSkype
			usersWithoutSkype: usersWithoutSkype
			skypeCall: skypeCall

		return ret


Template.skypeIntegration.events
	'keydown input[type=text]': (e, t) ->
		if e.keyCode is 13
			e.preventDefault()
			t.saveSetting()

	'click [data-edit]': (e, t) ->
		e.preventDefault()
		t.editing.set($(e.currentTarget).data('edit'))
		setTimeout (-> t.$('input.editing').focus().select()), 100

	'click .cancel': (e, t) ->
		e.preventDefault()
		t.editing.set()

	'click .save': (e, t) ->
		e.preventDefault()
		t.saveSetting()

Template.skypeIntegration.onCreated ->
	@editing = new ReactiveVar

	@validateLoginName = =>
		return true


	@saveSetting = =>
		Meteor.call 'updateSkypeLogin', Meteor.userId(), @$('input[name=skypeLogin]').val(), (err, result) ->
			if err
				return toastr.error TAPi18n.__(err.reason)
			toastr.success TAPi18n.__ 'Skype_login_changed_successfully'
		@editing.set()
		return true
