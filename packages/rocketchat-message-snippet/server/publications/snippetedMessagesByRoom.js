Meteor.publish('snippetedMessages', function(rid, limit=50) {
	if (typeof this.userId === 'undefined' || this.userId === null) {
		return this.ready();
	}

	let publication = this;

	let user = RocketChat.models.Users.findOneById(this.userId);

	if (typeof user === 'undefined' || user === null) {
		return this.ready();
	}

	let cursorHandle = RocketChat.models.Messages.findSnippetedByRoom(
		rid,
		{
			sort: {ts: -1},
			limit: limit
		}
	).observeChanges({
		added: function(_id, record) {
			publication.added('rocketchat_snippeted_message', _id, record);
		},
		changed: function(_id, record) {
			publication.changed('rocketchat_snippeted_message', _id, record);
		},
		removed: function(_id) {
			publication.removed('rocketchat_snippeted_message', _id);
		}
	});
	this.ready();

	this.onStop = function() {
		cursorHandle.stop();
	};
});
