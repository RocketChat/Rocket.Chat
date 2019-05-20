import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { normalizeMessagesForUser } from '../../app/utils/server/lib/normalizeMessagesForUser';
import { Messages } from '../../app/models';

Meteor.publish('messages', function(rid/* , start*/) {
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

	const cursor = Messages.findVisibleByRoomId(rid, {
		sort: {
			ts: -1,
		},
		limit: 50,
	});

	const cursorHandle = cursor.observeChanges({
		added(_id, record) {
			const [message] = normalizeMessagesForUser([record], publication.userId);
			return publication.added('rocketchat_message', _id, message);
		},
		changed(_id, record) {
			const [message] = normalizeMessagesForUser([record], publication.userId);
			return publication.changed('rocketchat_message', _id, message);
		},
	});

	const cursorDelete = Messages.findInvisibleByRoomId(rid, {
		fields: {
			_id: 1,
		},
	});

	const cursorDeleteHandle = cursorDelete.observeChanges({
		added(_id/* , record*/) {
			return publication.added('rocketchat_message', _id, {
				_hidden: true,
			});
		},
		changed(_id/* , record*/) {
			return publication.added('rocketchat_message', _id, {
				_hidden: true,
			});
		},
	});

	this.ready();

	return this.onStop(function() {
		cursorHandle.stop();
		return cursorDeleteHandle.stop();
	});
});

Meteor.methods({
	'messages/get'(rid, { lastUpdate, latestDate = new Date(), oldestDate, inclusive = false, count = 20, unreads = false }) {
		check(rid, String);

		const fromId = Meteor.userId();

		if (!fromId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'messages/get',
			});
		}

		if (!Meteor.call('canAccessRoom', rid, fromId)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'messages/get',
			});
		}

		const options = {
			sort: {
				ts: -1,
			},
		};

		if (lastUpdate instanceof Date) {
			return {
				updated: Messages.findForUpdates(rid, lastUpdate, options).fetch(),
				deleted: Messages.trashFindDeletedAfter(lastUpdate, { rid }, { ...options, fields: { _id: 1, _deletedAt: 1 } }).fetch(),
			};
		}

		return Meteor.call('getChannelHistory', { rid, latest: latestDate, oldest: oldestDate, inclusive, count, unreads });
	},
});
