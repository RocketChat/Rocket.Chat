RocketChat.models.Messages.addTranslations = function(messageId, translations, providerName) {
	const updateObj = { translationProvider: providerName };
	Object.keys(translations).forEach((key) => {
		const translation = translations[key];
		updateObj[`translations.${ key }`] = translation;
	});
	return this.update({ _id: messageId }, { $set: updateObj });
};

RocketChat.models.Messages.addAttachmentTranslations = function(messageId, attachmentIndex, translations) {
	const updateObj = {};
	Object.keys(translations).forEach((key) => {
		const translation = translations[key];
		updateObj[`attachments.${ attachmentIndex }.translations.${ key }`] = translation;
	});
	return this.update({ _id: messageId }, { $set: updateObj });
};
