RocketChat.saveCustomFieldsWithoutValidation = function(userId, formData) {
	if (s.trim(RocketChat.settings.get('Accounts_CustomFields')) === '') {
		return;
	}

	let customFieldsMeta;
	try {
		customFieldsMeta = JSON.parse(RocketChat.settings.get('Accounts_CustomFields'));
	} catch (e) {
		throw new Meteor.Error('error-invalid-customfield-json', 'Invalid JSON for Custom Fields');
	}

	const customFields = Object.keys(customFieldsMeta).filter(fieldName => !customFieldsMeta[fieldName].modifyRecordField).
		reduce((update, key) => {
			update[key] = formData[key];
			return update;
		}, {});


	RocketChat.models.Users.setCustomFields(userId, customFields);
	const update = Object.keys(customFieldsMeta).
		filter(fieldName => customFieldsMeta[fieldName].modifyRecordField).
		reduce((update, fieldName) => {
			const modifyRecordField = customFieldsMeta[fieldName].modifyRecordField;
			if (modifyRecordField.array) {
				update.$addToSet[modifyRecordField.field] = formData[fieldName];
			} else {
				update.$set[modifyRecordField.field] = formData[fieldName];
			}
			return update;
		}, {
			$addToSet: {},
			$set: {}
		});
	RocketChat.models.Users.update(userId, update);
};
