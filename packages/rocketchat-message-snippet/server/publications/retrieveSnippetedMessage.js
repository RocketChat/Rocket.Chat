Meteor.publish('retrieveSnippetedMessage', function(snippetId) {
	if (typeof this.userId === 'undefined' || this.userId === null) {
		return this.ready();
	}

	let publication = this;

	let user = RocketChat.models.Users.findOneById(this.userId);

	if (typeof user === 'undefined' || user === null) {
		return this.ready();
	}

	let cursor = RocketChat.models.Messages.find(
		{
			snippetId: snippetId
		}
	).observeChanges({
		added: function(_id, record) {
			publication.added('rocketchat_message', _id, record);
		},
		changed: function(_id, record) {
			publication.changed('rocketchat_message', _id, record);
		},
		removed: function(_id) {
			publication.removed('rocketchat_message', _id);
		}
	});

	this.ready();

	this.onStop = function() {
		cursor.stop();
	};
});
