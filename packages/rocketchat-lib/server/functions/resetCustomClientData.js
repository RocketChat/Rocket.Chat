RocketChat.resetCustomClientData = async(userId) => {
	const customClientData = {};
	RocketChat.models.Users.update({ _id: userId }, { $set: { customClientData }});

	return true;
};
