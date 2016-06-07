/**
 * Adds userId to jitsiConnected list of connected users
 * @param {string} _id - Room id
 * @param {string} userId - User id
 */
RocketChat.models.Rooms.addJitsiConnected = function(_id, userId) {
	const query = {
		_id: _id
	};

	const update = {
		$addToSet: {
			jitsiConnected: userId
		}
	}

	return this.update(query, update);
};

/**
 * Removes userId from jitsiConnected list of connected users
 * @param {string} _id - Room id
 * @param {string} userId - User id
 */
RocketChat.models.Rooms.removeJitsiConnected = function(_id, userId) {
	const query = {
		_id: _id
	};

	const update = {
		$pull: {
			jitsiConnected: userId
		}
	}

	return this.update(query, update);
};
