import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { hasPermission } from 'meteor/rocketchat:authorization';
import AutoTranslate from '../autotranslate';

Meteor.methods({
	'autoTranslate.getSupportedLanguages'(targetLanguage) {
		if (!hasPermission(Meteor.userId(), 'auto-translate')) {
			throw new Meteor.Error('error-action-not-allowed', 'Auto-Translate is not allowed', { method: 'autoTranslate.saveSettings' });
		}

		return AutoTranslate.getSupportedLanguages(targetLanguage);
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'autoTranslate.getSupportedLanguages',
	userId(/* userId*/) {
		return true;
	},
}, 5, 60000);
