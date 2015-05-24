Meteor.methods
	registerUser: (formData) ->
		userData =
			email: formData.email
			password: formData.pass

		userId = Accounts.createUser userData

		Meteor.users.update userId,
			$set:
				name: formData.name

		Accounts.sendVerificationEmail(userId, userData.email);
