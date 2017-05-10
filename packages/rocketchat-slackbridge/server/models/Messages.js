RocketChat.models.Messages.findOneBySlackFileId = function(slackFileID) {
	return this.findOne({
		'file.imported_id': slackFileID
	});
};

RocketChat.models.Messages.setSlackFileId = function(_id, slackFileID) {
	const updateObj = {
		'file.imported_id': slackFileID
	};

	return this.update({ _id }, { $set: updateObj });
};

RocketChat.models.Messages.setSlackTs = function(_id, slackTs) {
	const updateObj = {
		slackTs
	};

	return this.update({ _id }, { $set: updateObj });
};

RocketChat.models.Messages.setSlackFileIdAndSlackTs = function(_id, slackFileID, slackTs) {
	const updateObj = {
		'file.imported_id': slackFileID,
		slackTs
	};

	return this.update({ _id }, { $set: updateObj });
};
