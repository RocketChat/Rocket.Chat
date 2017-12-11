Meteor.publish('channelAndPrivateAutocomplete', function(selector) {
	if (!this.userId) {
		return this.ready();
	}

	if (RocketChat.authz.hasPermission(this.userId, 'view-other-user-channels') !== true) {
		return this.ready();
	}

	const pub = this;
	const options = {
		fields: {
			_id: 1,
			name: 1
		},
		limit: 10,
		sort: {
			name: 1
		}
	};

	const cursorHandle = RocketChat.models.Rooms.findByNameStartingAndTypes(selector.name, ['c', 'p'], options).observeChanges({
		added(_id, record) {
			return pub.added('autocompleteRecords', _id, record);
		},
		changed(_id, record) {
			return pub.changed('autocompleteRecords', _id, record);
		},
		removed(_id, record) {
			return pub.removed('autocompleteRecords', _id, record);
		}
	});

	this.ready();

	this.onStop(function() {
		return cursorHandle.stop();
	});
});
