Meteor.methods({
	'autoTranslate.getSupportedLanguages'(targetLanguage) {
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
