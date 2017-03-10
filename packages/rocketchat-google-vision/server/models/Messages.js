RocketChat.models.Messages.setGoogleVision = function(messageId, googleVision, visionType) {
	const updateObj = {};
	if (visionType) {
		updateObj[`attachments.0.googleVision.${visionType}`] = googleVision;
	} else {
		updateObj['attachments.0.googleVision'] = googleVision;
	}

	return this.update({ _id: messageId }, { $set: updateObj });
};
