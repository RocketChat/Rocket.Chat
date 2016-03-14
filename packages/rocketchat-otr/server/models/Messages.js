RocketChat.models.Messages.deleteOldOTRMessages = function (roomId, ts) {
	var query = { rid: roomId, otr: true, ts: { $lte: ts } };
	return this.remove(query);
}
