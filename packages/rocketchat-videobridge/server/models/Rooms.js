/**
 * sets jitsiTimeout to indicate a call is in progress
 * @param {string} _id - Room id
 * @parm {number} time - time to set
 */
RocketChat.models.Rooms.setJitsiTimeout = function(_id, time) {
	const query = {
		_id
	};

	const update = {
		$set: {
			jitsiTimeout: time
		}
	};

	return this.update(query, update);
};
