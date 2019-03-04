import * as Models from 'meteor/rocketchat:models';

/**
 * Resets the customClientData property of the user with id equal to userId
 * @param {string} userId _id property of the user
 */
export const resetCustomClientData = async(userId) => {
	const customClientData = {};
	Models.Users.update({ _id: userId }, { $unset: { customClientData } });

	return true;
};
