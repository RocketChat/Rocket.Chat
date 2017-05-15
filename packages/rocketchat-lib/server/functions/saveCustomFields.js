RocketChat.saveCustomFields = function(userId, formData) {
	if (s.trim(RocketChat.settings.get('Accounts_CustomFields')) !== '') {
		let customFieldsMeta;
		try {
			customFieldsMeta = JSON.parse(RocketChat.settings.get('Accounts_CustomFields'));
		} catch (e) {
			throw new Meteor.Error('error-invalid-customfield-json', 'Invalid JSON for Custom Fields');
		}

		const customFields = {};

		Object.keys(customFieldsMeta).forEach((fieldName) => {
			const field = customFieldsMeta[fieldName];

			customFields[fieldName] = formData[fieldName];
			if (field.required && !formData[fieldName]) {
				throw new Meteor.Error('error-user-registration-custom-field', `Field ${ fieldName } is required`, { method: 'registerUser' });
			}

			if (field.type === 'select' && field.options.indexOf(formData[fieldName]) === -1) {
				throw new Meteor.Error('error-user-registration-custom-field', `Value for field ${ fieldName } is invalid`, { method: 'registerUser' });
			}

			if (field.maxLength && formData[fieldName].length > field.maxLength) {
				throw new Meteor.Error('error-user-registration-custom-field', `Max length of field ${ fieldName } ${ field.maxLength }`, { method: 'registerUser' });
			}

			if (field.minLength && formData[fieldName].length < field.minLength) {
				throw new Meteor.Error('error-user-registration-custom-field', `Min length of field ${ fieldName } ${ field.minLength }`, { method: 'registerUser' });
			}
		});

		// for fieldName, field of customFieldsMeta
		RocketChat.models.Users.setCustomFields(userId, customFields);

		Object.keys(customFields).forEach((fieldName) => {
			if (!customFieldsMeta[fieldName].modifyRecordField) {
				return;
			}

			const modifyRecordField = customFieldsMeta[fieldName].modifyRecordField;
			const update = {};
			if (modifyRecordField.array) {
				update.$addToSet = {};
				update.$addToSet[modifyRecordField.field] = customFields[fieldName];
			} else {
				update.$set = {};
				update.$set[modifyRecordField.field] = customFields[fieldName];
			}

			RocketChat.models.Users.update(userId, update);
		});

		return true;
	}
};
