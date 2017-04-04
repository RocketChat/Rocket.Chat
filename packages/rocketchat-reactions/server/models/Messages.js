RocketChat.models.Messages.setReactions = function(messageId, reactions) {
	return this.update({ _id: messageId }, { $set: { reactions }});
};

RocketChat.models.Messages.unsetReactions = function(messageId) {
	return this.update({ _id: messageId }, { $unset: { reactions: 1 }});
};
