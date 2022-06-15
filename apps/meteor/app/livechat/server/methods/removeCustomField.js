import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { LivechatCustomField } from '../../../models';

Meteor.methods({
	'livechat:removeCustomField'(_id) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeCustomField',
			});
		}

		check(_id, String);

		const customField = LivechatCustomField.findOneById(_id, { fields: { _id: 1 } });

		if (!customField) {
			throw new Meteor.Error('error-invalid-custom-field', 'Custom field not found', {
				method: 'livechat:removeCustomField',
			});
		}

		return LivechatCustomField.removeById(_id);
	},
});
