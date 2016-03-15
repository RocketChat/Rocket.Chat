RocketChat.models.Messages.deleteOldOTRMessages = function (roomId, ts) {
	var query = { rid: roomId, t: { $in: [ 'otr', 'otr-ack' ] }, ts: { $lte: ts } };
	return this.remove(query);
};

RocketChat.models.Messages.updateOTRAckAndType = function(_id, otrAck) {
	var query = { _id: _id };
	var update = { $set: { otrAck: otrAck, t: 'otr-ack' } };
	return this.update(query, update);
};
