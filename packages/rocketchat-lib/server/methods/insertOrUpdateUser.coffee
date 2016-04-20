Meteor.methods
	insertOrUpdateUser: (userData) ->
		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'insertOrUpdateUser' })

		user = Meteor.user()

		canEditUser = RocketChat.authz.hasPermission( user._id, 'edit-other-user-info')
		canAddUser = RocketChat.authz.hasPermission( user._id, 'create-user')

		if userData._id and user._id isnt userData._id and canEditUser isnt true
			throw new Meteor.Error 'error-action-not-allowed', 'Editing user is not allowed', { method: 'insertOrUpdateUser', action: 'Editing_user' }

		if not userData._id and canAddUser isnt true
			throw new Meteor.Error 'error-action-not-allowed', 'Adding user is not allowd', { method: 'insertOrUpdateUser', action: 'Adding_user' }

		unless s.trim(userData.name)
			throw new Meteor.Error 'error-the-field-is-required', 'The field Name is required', { method: 'insertOrUpdateUser', field: 'Name' }

		unless s.trim(userData.username)
			throw new Meteor.Error 'error-the-field-is-required', 'The field Username is required', { method: 'insertOrUpdateUser', field: 'Username' }

		try
			nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
		catch
			nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'

		if not nameValidation.test userData.username
			throw new Meteor.Error 'error-input-is-not-a-valid-field', "#{username} is not a valid username", { method: 'insertOrUpdateUser', input: username, field: 'Username' }

		if not userData._id and not userData.password
			throw new Meteor.Error 'error-the-field-is-required', 'The field Password is required', { method: 'insertOrUpdateUser', field: 'Password' }

		if not userData._id
			if not RocketChat.checkUsernameAvailability userData.username
				throw new Meteor.Error 'error-field-unavailable', "#{userData.username} is already in use :(", { method: 'insertOrUpdateUser', field: userData.username }

			if userData.email and not RocketChat.checkEmailAvailability userData.email
				throw new Meteor.Error 'error-field-unavailable', "#{userData.email} is already in use :(", { method: 'insertOrUpdateUser', field: userData.email }

			RocketChat.validateEmailDomain(userData.email);

			# insert user
			createUser = { username: userData.username, password: userData.password }
			if userData.email
				createUser.email = userData.email

			_id = Accounts.createUser(createUser)

			updateUser =
				$set:
					name: userData.name

			if userData.requirePasswordChange
				updateUser.$set.requirePasswordChange = userData.requirePasswordChange

			Meteor.users.update { _id: _id }, updateUser

			return _id
		else
			#update user
			Meteor.users.update { _id: userData._id }, { $set: { name: userData.name, requirePasswordChange: userData.requirePasswordChange } }
			RocketChat.setUsername userData._id, userData.username
			RocketChat.setEmail userData._id, userData.email

			canEditUserPassword = RocketChat.authz.hasPermission( user._id, 'edit-other-user-password')
			if canEditUserPassword and userData.password.trim()
				Accounts.setPassword userData._id, userData.password.trim()

			return true
