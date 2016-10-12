Meteor.publish("retrieveSnippetMessage", function(snippetId) {
	let messageSnippetedCollection = 'rocketchat_snippeted_message';

	if (typeof this.userId == "undefined" || this.userId == null) {
		return this.ready();
	}

	let publication = this;

	let user = RocketChat.models.Users.findOneById(this.userId);

	if (typeof user == "undefined" || user == null) {
	 	return this.ready();
	}

	let cursor = RocketChat.models.SnippetMessage.find(
		{
			_id: snippetId
		}
	).observeChanges({
		added: function(_id, record) {
			publication.added(messageSnippetedCollection, _id, record);
		},
		changed: function(_id, record) {
			publication.changed(messageSnippetedCollection, _id, record);
		},
		removed: function(_id) {
			publication.removed(messageSnippetedCollection, _id);
		}
	});

	this.ready();

	this.onStop = function() {
		cursor.stop();
	}
});
