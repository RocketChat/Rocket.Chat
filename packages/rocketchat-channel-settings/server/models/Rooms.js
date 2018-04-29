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
			ro: readOnly
		}
	};
	if (readOnly) {
		RocketChat.models.Subscriptions.findByRoomId(_id).forEach(function(subscription) {
			if (subscription.u == null || subscription.u._id == null || subscription.u.username == null) {
				return;
			}

			if (RocketChat.authz.hasPermission(subscription.u._id, 'post-readonly') === false) {
				if (!update.$set.muted) {
					update.$set.muted = [];
				}
				return update.$set.muted.push(subscription.u.username);
			}
		});
	} else {
		update.$unset = {
			muted: ''
		};
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
