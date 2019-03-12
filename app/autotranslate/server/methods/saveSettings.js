import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { Subscriptions } from 'meteor/rocketchat:models';

Meteor.methods({
	'autoTranslate.saveSettings'(rid, field, value, options) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'saveAutoTranslateSettings' });
		}

		if (!hasPermission(Meteor.userId(), 'auto-translate')) {
			throw new Meteor.Error('error-action-not-allowed', 'Auto-Translate is not allowed', { method: 'autoTranslate.saveSettings' });
		}

		check(rid, String);
		check(field, String);
		check(value, String);

		if (['autoTranslate', 'autoTranslateLanguage'].indexOf(field) === -1) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings field', { method: 'saveAutoTranslateSettings' });
		}

		const subscription = Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', { method: 'saveAutoTranslateSettings' });
		}

		switch (field) {
			case 'autoTranslate':
				Subscriptions.updateAutoTranslateById(subscription._id, value === '1');
				if (!subscription.autoTranslateLanguage && options.defaultLanguage) {
					Subscriptions.updateAutoTranslateLanguageById(subscription._id, options.defaultLanguage);
				}
				break;
			case 'autoTranslateLanguage':
				Subscriptions.updateAutoTranslateLanguageById(subscription._id, value);
				break;
		}

		return true;
	},
});
