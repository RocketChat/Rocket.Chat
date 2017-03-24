RocketChat.models.Messages.deleteOldOTRMessages = function(roomId, ts) {
	var query = { rid: roomId, t: 'otr', ts: { $lte: ts } };
	return this.remove(query);
};

RocketChat.models.Messages.updateOTRAck = function(_id, otrAck) {
	var query = { _id };
	var update = { $set: { otrAck } };
	return this.update(query, update);
};
