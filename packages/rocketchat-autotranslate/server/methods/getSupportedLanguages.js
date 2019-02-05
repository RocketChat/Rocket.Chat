import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'autoTranslate.getSupportedLanguages'(targetLanguage) {
		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'auto-translate')) {
			throw new Meteor.Error('error-action-not-allowed', 'Auto-Translate is not allowed', { method: 'autoTranslate.saveSettings' });
		}

		return RocketChat.AutoTranslate.getSupportedLanguages(targetLanguage);
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'autoTranslate.getSupportedLanguages',
	userId(/* userId*/) {
		return true;
	},
}, 5, 60000);
