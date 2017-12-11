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
			if (subscription._user == null) {
				return;
			}
			const user = subscription._user;
			if (RocketChat.authz.hasPermission(user._id, 'post-readonly') === false) {
				if (!update.$set.muted) {
					update.$set.muted = [];
				}
				return update.$set.muted.push(user.username);
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
