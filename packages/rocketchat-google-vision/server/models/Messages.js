RocketChat.models.Messages.setGoogleVisionData = function(messageId, visionData) {
	const updateObj = {};
	for (const index in visionData) {
		if (visionData.hasOwnProperty(index)) {
			updateObj[`attachments.0.${ index }`] = visionData[index];
		}
	}

	return this.update({ _id: messageId }, { $set: updateObj });
};
