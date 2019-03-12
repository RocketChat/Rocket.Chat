import { Meteor } from 'meteor/meteor';
import { Messages, Users, Rooms } from '/app/models';

Meteor.publish('snippetedMessage', function(_id) {
	if (typeof this.userId === 'undefined' || this.userId === null) {
		return this.ready();
	}

	const snippet = Messages.findOne({ _id, snippeted: true });
	const user = Users.findOneById(this.userId);
	const roomSnippetQuery = {
		_id: snippet.rid,
		usernames: {
			$in: [
				user.username,
			],
		},
	};

	if (!Meteor.call('canAccessRoom', snippet.rid, this.userId)) {
		return this.ready();
	}

	if (Rooms.findOne(roomSnippetQuery) === undefined) {
		return this.ready();
	}

	const publication = this;


	if (typeof user === 'undefined' || user === null) {
		return this.ready();
	}

	const cursor = Messages.find(
		{ _id }
	).observeChanges({
		added(_id, record) {
			publication.added('rocketchat_snippeted_message', _id, record);
		},
		changed(_id, record) {
			publication.changed('rocketchat_snippeted_message', _id, record);
		},
		removed(_id) {
			publication.removed('rocketchat_snippeted_message', _id);
		},
	});

	this.ready();

	this.onStop = function() {
		cursor.stop();
	};
});
