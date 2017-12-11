RocketChat.models.Users.rocketMailUnsubscribe = function(_id, createdAt) {
	const query = {
		_id,
		createdAt: new Date(parseInt(createdAt))
	};
	const update = {
		$set: {
			'mailer.unsubscribed': true
		}
	};
	const affectedRows = this.update(query, update);
	console.log('[Mailer:Unsubscribe]', _id, createdAt, new Date(parseInt(createdAt)), affectedRows);
	return affectedRows;
};
