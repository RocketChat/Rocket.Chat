Meteor.publish('messages', function(rid/*, start*/) {
	if (!this.userId) {
		return this.ready();
	}

	const publication = this;

	if (typeof rid !== 'string') {
		return this.ready();
	}

	if (!Meteor.call('canAccessRoom', rid, this.userId)) {
		return this.ready();
	}

	const cursor = RocketChat.models.Messages.findVisibleByRoomId(rid, {
		sort: {
			ts: -1
		},
		limit: 50
	});

	const cursorHandle = cursor.observeChanges({
		added(_id, record) {
			record.starred = _.findWhere(record.starred, {
				_id: publication.userId
			});
			return publication.added('rocketchat_message', _id, record);
		},
		changed(_id, record) {
			record.starred = _.findWhere(record.starred, {
				_id: publication.userId
			});
			return publication.changed('rocketchat_message', _id, record);
		}
	});

	const cursorDelete = RocketChat.models.Messages.findInvisibleByRoomId(rid, {
		fields: {
			_id: 1
		}
	});

	const cursorDeleteHandle = cursorDelete.observeChanges({
		added(_id/*, record*/) {
			return publication.added('rocketchat_message', _id, {
				_hidden: true
			});
		},
		changed(_id/*, record*/) {
			return publication.added('rocketchat_message', _id, {
				_hidden: true
			});
		}
	});

	this.ready();

	return this.onStop(function() {
		cursorHandle.stop();
		return cursorDeleteHandle.stop();
	});
});
