RocketChat.models.Messages.findOneBySlackFileId = function(slackFileID) {
	return this.findOne({
		'file.imported_id': slackFileID
	});
};
