RocketChat.models.Messages.deleteOldOTRMessages = function(roomId, ts) {
	const query = { rid: roomId, t: 'otr', ts: { $lte: ts } };
	return this.remove(query);
};

RocketChat.models.Messages.updateOTRAck = function(_id, otrAck) {
	const query = { _id };
	const update = { $set: { otrAck } };
	return this.update(query, update);
};
