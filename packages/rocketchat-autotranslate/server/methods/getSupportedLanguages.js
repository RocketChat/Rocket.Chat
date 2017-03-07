Meteor.methods({
	'autoTranslate.getSupportedLanguages'(targetLanguage) {
		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'auto-translate')) {
			throw new Meteor.Error('error-action-now-allowed', 'Auto-Translate is not allowed', { method: 'autoTranslate.saveSettings'});
		}

		return RocketChat.AutoTranslate.getSupportedLanguages(targetLanguage);
	}
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'autoTranslate.getSupportedLanguages',
	userId(/*userId*/) {
		return true;
	}
}, 5, 60000);
