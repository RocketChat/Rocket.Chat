/**
 * Resets the customClientData property of the user with id equal to userId
 * @param {string} userId _id property of the user
 */
RocketChat.resetCustomClientData = async(userId) => {
	const customClientData = {};
	RocketChat.models.Users.update({ _id: userId }, { $unset: { customClientData }});

	return true;
};
