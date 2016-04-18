/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.ObjectIncluding", "Match.Optional"]}] */

Meteor.methods({
	'livechat:saveCustomField' (_id, customFieldData) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('not-authorized');
		}

		if (_id) {
			check(_id, String);
		}

		check(customFieldData, Match.ObjectIncluding({ field: String, label: String, scope: String, visibility: String }));

		if (!/^[0-9a-zA-Z-_]+$/.test(customFieldData.field)) {
			throw new Meteor.Error('error-invalid-custom-field-nmae', 'Invalid custom field name. Use only letters, numbers, hyphens and underscores.', { method: 'livechat:saveCustomField' });
		}

		if (_id) {
			const customField = RocketChat.models.LivechatCustomField.findOneById(_id);
			if (!customField) {
				throw new Meteor.Error('error-invalid-custom-field', 'Custom Field Not found', { method: 'livechat:saveCustomField' });
			}
		}

		return RocketChat.models.LivechatCustomField.createOrUpdateCustomField(_id, customFieldData.field, customFieldData.label, customFieldData.scope, customFieldData.visibility);
	}
});
