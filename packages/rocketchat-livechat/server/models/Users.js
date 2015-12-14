/**
 * Sets an user as (non)operator
 * @param {string} _id - User's _id
 * @param {boolean} operator - Flag to set as operator or not
 */
RocketChat.models.Users.setOperator = function(_id, operator) {
	var update = {
		$set: {
			operator: operator
		}
	};

	return this.update(_id, update);
};

/**
 * Gets visitor by token
 * @param {string} token - Visitor token
 */
RocketChat.models.Users.getVisitorByToken = function(token, options) {
	var query = {
		"profile.guest": true,
		"profile.token": token
	};

	return this.findOne(query, options);
};
