RocketChat.models.Messages.addTranslations = function(messageId, translations) {
	const updateObj = {};
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
