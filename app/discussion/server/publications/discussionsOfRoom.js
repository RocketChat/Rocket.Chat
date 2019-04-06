import { Meteor } from 'meteor/meteor';

import { Messages } from '../../../models/server';

Meteor.publish('discussionsOfRoom', function(rid, limit = 50) {
	if (!this.userId) {
		return this.ready();
	}

	const publication = this;

	if (!Meteor.call('canAccessRoom', rid, this.userId)) {
		return this.ready();
	}

	const cursorHandle = Messages.find({ rid, drid: { $exists: true } }, { sort: { ts: -1 }, limit }).observeChanges({
		added(_id, record) {
			return publication.added('rocketchat_discussions_of_room', _id, record);
		},
		changed(_id, record) {
			return publication.changed('rocketchat_discussions_of_room', _id, record);
		},
		removed(_id) {
			return publication.removed('rocketchat_discussions_of_room', _id);
		},
	});

	this.ready();
	return this.onStop(function() {
		return cursorHandle.stop();
	});
});
