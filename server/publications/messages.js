import _ from 'underscore';

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

Meteor.methods({
	'messages/get'(rid, {lastUpdate, latestDate = new Date(), oldestDate, inclusive = false, count = 20, unreads= false}) {
		check(rid, String);

		const fromId = Meteor.userId();

		if (!fromId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'messages/get'
			});
		}

		if (!Meteor.call('canAccessRoom', rid, fromId)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'messages/get'
			});
		}

		const options = {
			sort: {
				ts: -1
			}
		};

		if (lastUpdate instanceof Date) {
			return {
				updated: RocketChat.models.Messages.findForUpdates(rid, lastUpdate, options).fetch(),
				deleted: RocketChat.models.Messages.trashFindDeletedAfter(lastUpdate, {rid}, { ...options, fields: { _id: 1, _deletedAt: 1 }}).fetch()
			};
		}

		return Meteor.call('getChannelHistory', { rid, latest: latestDate, oldest: oldestDate, inclusive, count, unreads });

	}
});
