Meteor.methods
	registerUser: (formData) ->
		userData =
			email: formData.email
			password: formData.pass

		userId = Accounts.createUser userData

		Meteor.users.update userId,
			$set:
				name: formData.name

		ChatMessage.insert
			rid: '57om6EQCcFami9wuT'
			ts: new Date()
			t: 'wm'
			msg: formData.name

		Accounts.sendVerificationEmail(userId, userData.email);
