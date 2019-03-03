import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { LivechatCustomField } from 'meteor/rocketchat:models';

Meteor.methods({
	'livechat:saveCustomField'(_id, customFieldData) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveCustomField' });
		}

		if (_id) {
			check(_id, String);
		}

		check(customFieldData, Match.ObjectIncluding({ field: String, label: String, scope: String, visibility: String }));

		if (!/^[0-9a-zA-Z-_]+$/.test(customFieldData.field)) {
			throw new Meteor.Error('error-invalid-custom-field-nmae', 'Invalid custom field name. Use only letters, numbers, hyphens and underscores.', { method: 'livechat:saveCustomField' });
		}

		if (_id) {
			const customField = LivechatCustomField.findOneById(_id);
			if (!customField) {
				throw new Meteor.Error('error-invalid-custom-field', 'Custom Field Not found', { method: 'livechat:saveCustomField' });
			}
		}

		return LivechatCustomField.createOrUpdateCustomField(_id, customFieldData.field, customFieldData.label, customFieldData.scope, customFieldData.visibility);
	},
});
