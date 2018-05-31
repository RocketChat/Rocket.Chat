RocketChat.updateBotData = function(user, botData) {
	const updateBotData = {
		$set: {
			'botData.ipAddress': botData.ipAddress,
			'botData.framework': botData.framework
		}
	};

	RocketChat.models.Users.update({ _id: user._id }, updateBotData);

	return true;
};
