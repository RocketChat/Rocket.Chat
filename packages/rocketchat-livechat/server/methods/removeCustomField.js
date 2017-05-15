Meteor.methods({
	'livechat:removeCustomField'(_id) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeCustomField' });
		}

		check(_id, String);

		const customField = RocketChat.models.LivechatCustomField.findOneById(_id, { fields: { _id: 1 } });

		if (!customField) {
			throw new Meteor.Error('error-invalid-custom-field', 'Custom field not found', { method: 'livechat:removeCustomField' });
		}

		return RocketChat.models.LivechatCustomField.removeById(_id);
	}
});
