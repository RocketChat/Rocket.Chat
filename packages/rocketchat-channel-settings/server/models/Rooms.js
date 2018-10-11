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
		},
	};

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
