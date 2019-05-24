RocketChat.models.Rooms.setDescriptionById = function(_id, description) {
	const query = {
		_id,
	};
	const update = {
		$set: {
			description,
		},
	};
	return this.update(query, update);
};

RocketChat.models.Rooms.setReadOnlyById = function(_id, readOnly) {
	const query = {
		_id,
	};
	const update = {
		$set: {
			ro: readOnly,
			muted: [],
		},
	};
	if (readOnly) {
		RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(_id, { fields: { 'u._id': 1, 'u.username': 1 } }).forEach(function({ u: user }) {
			if (RocketChat.authz.hasPermission(user._id, 'post-readonly')) {
				return;
			}
			return update.$set.muted.push(user.username);
		});
	} else {
		update.$unset = {
			muted: '',
		};
	}

	if (update.$set.muted.length === 0) {
		delete update.$set.muted;
	}

	return this.update(query, update);
};

RocketChat.models.Rooms.setAllowReactingWhenReadOnlyById = function(_id, allowReacting) {
	const query = {
		_id,
	};
	const update = {
		$set: {
			reactWhenReadOnly: allowReacting,
		},
	};
	return this.update(query, update);
};

RocketChat.models.Rooms.setSystemMessagesById = function(_id, systemMessages) {
	const query = {
		_id,
	};
	const update = {
		$set: {
			sysMes: systemMessages,
		},
	};
	return this.update(query, update);
};

RocketChat.models.Rooms.setMessageDelayById = function(_id, messageDelay) {
	const query = {
		_id,
	};
	const update = {
		$set: {
			messageDelayType: messageDelay.messageDelayType,
			messageDelayMS: messageDelay.messageDelayMS
		},
	};
	return this.update(query, update);
};
