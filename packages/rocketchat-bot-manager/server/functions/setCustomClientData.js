
import * as Models from 'meteor/rocketchat:models';

/**
 * Updates the user model with data about the custom client being used by the user
 * Useful to know if a logged in user will respond to certain DDP Requests
 */
export const setCustomClientData = function(user, clientData) {
	const updateCustomClientData = {
		$set: {
			customClientData: clientData,
		},
	};

	Models.Users.update({ _id: user._id }, updateCustomClientData);

	return true;
};
