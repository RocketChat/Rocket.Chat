RocketChat.setCustomClientData = function(user, clientData) {
	const updateCustomClientData = {
		$set: {
			customClientData: clientData
		}
	};

	RocketChat.models.Users.update({ _id: user._id }, updateCustomClientData);

	return true;
};
