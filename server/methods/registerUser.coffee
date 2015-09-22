Meteor.methods
	registerUser: (formData) ->
		userData =
			email: formData.email
			password: formData.pass

		userId = Accounts.createUser userData

		RocketChat.models.Users.setName userId, formData.name

		if userData.email
			Accounts.sendVerificationEmail(userId, userData.email);
