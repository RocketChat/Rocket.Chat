RocketChat.updateBotData = function(user, botData) {
	const bot = RocketChat.models.Bots.findOneByUsername(user.username);

	if (!bot) {

		// insert bot acc
		const createBot = {
			account: {
				_id: user._id,
				username: user.username
			},
			framework: botData.framework,
			ipAddress: botData.ipAddress,
			paused: false
		};

		return RocketChat.models.Bots.createWithFullBotData(createBot);
	} else {

		const updateBotData = {
			$set: {
				ipAddress: botData.ipAddress,
				framework: botData.framework
			}
		};

		RocketChat.models.Bots.update({ _id: bot._id }, updateBotData);

		return true;
	}
};
