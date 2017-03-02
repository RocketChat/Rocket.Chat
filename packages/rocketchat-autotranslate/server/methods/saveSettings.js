Meteor.methods({
	'autoTranslate.saveSettings': function(rid, field, value, options) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'saveAutoTranslateSettings' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'auto-translate')) {
			throw new Meteor.Error('error-action-now-allowed', 'Auto-Translate is not allowed', { method: 'autoTranslate.saveSettings'});
		}

		check(rid, String);
		check(field, String);
		check(value, String);

		if (['autoTranslate', 'autoTranslateLanguage'].indexOf(field) === -1) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings field', { method: 'saveAutoTranslateSettings' });
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', { method: 'saveAutoTranslateSettings' });
		}

		switch (field) {
			case 'autoTranslate':
				RocketChat.models.Subscriptions.updateAutoTranslateById(subscription._id, value === '1' ? true : false);
				if (!subscription.autoTranslateLanguage && options.defaultLanguage) {
					RocketChat.models.Subscriptions.updateAutoTranslateLanguageById(subscription._id, options.defaultLanguage);
				}
				break;
			case 'autoTranslateLanguage':
				RocketChat.models.Subscriptions.updateAutoTranslateLanguageById(subscription._id, value);
				break;
		}

		return true;
	}
});
