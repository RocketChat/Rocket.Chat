Meteor.methods
	registerUser: (formData) ->
		if RocketChat.settings.get('Accounts_RegistrationForm') is 'Disabled'
			throw new Meteor.Error 'error-user-registration-disabled', 'User registration is disabled', { method: 'registerUser' }

		else if RocketChat.settings.get('Accounts_RegistrationForm') is 'Secret URL' and (not formData.secretURL or formData.secretURL isnt RocketChat.settings.get('Accounts_RegistrationForm_SecretURL'))
			throw new Meteor.Error 'error-user-registration-secret', 'User registration is only allowed via Secret URL', { method: 'registerUser' }

		RocketChat.validateEmailDomain(formData.email);

		userData =
			email: s.trim(formData.email.toLowerCase())
			password: formData.pass

		userId = Accounts.createUser userData

		RocketChat.models.Users.setName userId, s.trim(formData.name)


		if RocketChat.settings.get('Accounts_CustomFields') isnt ''
			try
				customFieldsMeta = JSON.parse RocketChat.settings.get('Accounts_CustomFields')

				customFields = {}
				for fieldName, field of customFieldsMeta
					customFields[fieldName] = formData[fieldName]
					if field.required is true and not formData[fieldName]
						return throw new Meteor.Error 'error-user-registration-custom-field', "Field #{fieldName} is required", { method: 'registerUser' }

					if field.type is 'select' and field.options.indexOf(formData[fieldName]) is -1
						return throw new Meteor.Error 'error-user-registration-custom-field', "Value for field #{fieldName} is invalid", { method: 'registerUser' }

					if field.maxLength? and formData[fieldName].length > field.maxLength
						return throw new Meteor.Error 'error-user-registration-custom-field', "Max length of field #{fieldName} #{field.maxLength}", { method: 'registerUser' }

					if field.minLength? and formData[fieldName].length < field.minLength
						return throw new Meteor.Error 'error-user-registration-custom-field', "Min length of field #{fieldName} #{field.minLength}", { method: 'registerUser' }

				RocketChat.models.Users.setCustomFields userId, customFields

				for fieldName, value of customFields when customFieldsMeta[fieldName].modifyRecordField?
					modifyRecordField = customFieldsMeta[fieldName].modifyRecordField
					update = {}
					if modifyRecordField.array is true
						update.$addToSet = {}
						update.$addToSet[modifyRecordField.field] = value
					else
						update.$set = {}
						update.$set[modifyRecordField.field] = value

					RocketChat.models.Users.update userId, update

			catch e
				console.error('Invalid JSON for Accounts_CustomFields')

		if userData.email
			Accounts.sendVerificationEmail(userId, userData.email);

		return userId
