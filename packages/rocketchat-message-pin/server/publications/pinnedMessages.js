Meteor.publish('pinnedMessages', function(rid, limit = 50) {
	if (!this.userId) {
		return this.ready();
	}
	const publication = this;

	const user = RocketChat.models.Users.findOneById(this.userId);
	if (!user) {
		return this.ready();
	}
	const cursorHandle = RocketChat.models.Messages.findPinnedByRoom(rid, { sort: { ts: -1 }, limit }).observeChanges({
		added(_id, record) {
			return publication.added('rocketchat_pinned_message', _id, record);
		},
		changed(_id, record) {
			return publication.changed('rocketchat_pinned_message', _id, record);
		},
		removed(_id) {
			return publication.removed('rocketchat_pinned_message', _id);
		}
	});
	this.ready();
	return this.onStop(function() {
		return cursorHandle.stop();
	});
});
