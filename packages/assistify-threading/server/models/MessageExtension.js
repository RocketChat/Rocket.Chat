Object.assign(RocketChat.models.Messages, {
	//Update
	updateMsgWithThreadMessage(type, _id, message, user, extraData) {
		const query = {_id};
		const update = {
			$set: {
				msg: message,
				t: type,
				editedAt: new Date(),
				editedBy: {
					_id: user._id,
					username: user.username
				}
			}
		};
		Object.assign(update.$set, extraData);
		return this.update(query, update);
	}
});


