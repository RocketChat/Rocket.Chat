Meteor.publish('snippetedMessages', function(rid, limit=50) {
	if (typeof this.userId === 'undefined' || this.userId === null) {
		return this.ready();
	}

	const publication = this;

	const user = RocketChat.models.Users.findOneById(this.userId);

	if (typeof user === 'undefined' || user === null) {
		return this.ready();
	}

	const cursorHandle = RocketChat.models.Messages.findSnippetedByRoom(
		rid,
		{
			sort: {ts: -1},
			limit
		}
	).observeChanges({
		added(_id, record) {
			publication.added('rocketchat_snippeted_message', _id, record);
		},
		changed(_id, record) {
			publication.changed('rocketchat_snippeted_message', _id, record);
		},
		removed(_id) {
			publication.removed('rocketchat_snippeted_message', _id);
		}
	});
	this.ready();

	this.onStop = function() {
		cursorHandle.stop();
	};
});
