RocketChat.resetCustomClientData = async(userId) => {
	const customClientData = {};
	RocketChat.models.Users.update({ _id: userId }, { $unset: { customClientData }});

	return true;
};
