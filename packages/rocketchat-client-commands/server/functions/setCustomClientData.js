RocketChat.setCustomClientData = function(user, clientData) {
	if (clientData.canPauseResumeMsgStream && clientData.pausedMsgStream === undefined) {
		clientData.pausedMsgStream = false;
		Meteor.call('UserPresence:setDefaultStatus', user._id, 'online');
	}

	const updateCustomClientData = {
		$set: {
			customClientData: clientData
		}
	};

	RocketChat.models.Users.update({ _id: user._id }, updateCustomClientData);

	return true;
};
