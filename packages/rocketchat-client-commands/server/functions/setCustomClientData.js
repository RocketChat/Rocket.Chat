/**
 * Updates the user model with data about the custom client being used by the user
 * Useful to know if a logged in user will respond to certain ClientCommands
 */
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
