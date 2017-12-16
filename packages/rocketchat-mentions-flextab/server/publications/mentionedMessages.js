Meteor.publish('mentionedMessages', function(rid, limit = 50) {
	if (!this.userId) {
		return this.ready();
	}
	const publication = this;
	const user = RocketChat.models.Users.findOneById(this.userId);
	if (!user) {
		return this.ready();
	}
	const cursorHandle = RocketChat.models.Messages.findVisibleByMentionAndRoomId(user.username, rid, {
		sort: {
			ts: -1
		},
		limit
	}).observeChanges({
		added(_id, record) {
			record.mentionedList = true;
			return publication.added('rocketchat_mentioned_message', _id, record);
		},
		changed(_id, record) {
			record.mentionedList = true;
			return publication.changed('rocketchat_mentioned_message', _id, record);
		},
		removed(_id) {
			return publication.removed('rocketchat_mentioned_message', _id);
		}
	});
	this.ready();
	return this.onStop(function() {
		return cursorHandle.stop();
	});
});
