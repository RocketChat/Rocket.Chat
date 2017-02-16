RocketChat.models.Messages.setTranslations = function(messageId, translations) {
	return this.update({ _id: messageId }, { $set: { translations: translations }});
};
