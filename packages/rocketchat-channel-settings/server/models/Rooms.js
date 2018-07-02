RocketChat.models.Rooms.setDescriptionById = function(_id, description) {
	const query = {
		_id
	};
	const update = {
		$set: {
			description
		}
	};
	return this.update(query, update);
};

RocketChat.models.Rooms.setReadOnlyById = function(_id, readOnly) {
	const query = {
		_id
	};
	const update = {
		$set: {
			ro: readOnly,
			muted: []
		}
	};
	if (readOnly) {
		RocketChat.models.Subscriptions.find({ rid: _id, 'u._id' : { $exists : 1 }, 'u.username' : { $exists : 1 } }).forEach(function(subscription) {
			if (RocketChat.authz.hasPermission(subscription.u._id, 'post-readonly')) {
				return;
			}
			return update.$set.muted.push(subscription.u.username);
		});
	} else {
		update.$unset = {
			muted: ''
		};
	}

	if (update.$set.muted.length === 0) {
		delete update.$set.muted;
	}

	return this.update(query, update);
};

RocketChat.models.Rooms.setAllowReactingWhenReadOnlyById = function(_id, allowReacting) {
	const query = {
		_id
	};
	const update = {
		$set: {
			reactWhenReadOnly: allowReacting
		}
	};
	return this.update(query, update);
};

RocketChat.models.Rooms.setSystemMessagesById = function(_id, systemMessages) {
	const query = {
		_id
	};
	const update = {
		$set: {
			sysMes: systemMessages
		}
	};
	return this.update(query, update);
};
