import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';

import { hasPermission } from '../../../../authorization';
import { MentionGroups } from '../../../../models';

Meteor.publish('mentionGroupsAutocomplete', function(selector) {
	const uid = this.userId;
	if (!uid) {
		return this.ready();
	}

	if (!_.isObject(selector)) {
		return this.ready();
	}

	if (!hasPermission(uid, 'view-outside-room')) {
		return this.ready();
	}

	const options = {
		fields: {
			id: 1,
			name: 1,
		},
		sort: {
			name: 1,
		},
		limit: 10,
	};

	const pub = this;
	const exceptions = selector.exceptions || [];
	const conditions = selector.conditions || {};
	const termRegex = new RegExp(s.escapeRegExp(selector.term), 'i');

	const cursorHandle = MentionGroups.find({
		name: termRegex,
		_id: {
			$nin: exceptions,
		},
		...conditions,
	}, options).observeChanges({
		added(_id, record) {
			return pub.added('autocompleteRecords', _id, record);
		},
		changed(_id, record) {
			return pub.changed('autocompleteRecords', _id, record);
		},
		removed(_id, record) {
			return pub.removed('autocompleteRecords', _id, record);
		},
	});

	this.ready();

	this.onStop(function() {
		return cursorHandle.stop();
	});
});
