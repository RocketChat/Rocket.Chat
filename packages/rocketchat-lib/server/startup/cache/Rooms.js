/* eslint new-cap: 0 */

RocketChat.cache.Rooms = new (class CacheRoom extends RocketChat.cache._Base {
	constructor() {
		super('Rooms');

		this.ignoeUpdatedFields.push('msgs', 'lm');

		this.options = {fields: {usernames: 0}};
	}

	// FIND ONE
	findOneById(_id/*, options*/) {
		return this.findByIndex('_id', _id).fetch();
	}

	findOneByIdOrName(_idOrName, options) {
		const query = {
			$or: [{
				_id: _idOrName
			}, {
				name: _idOrName
			}]
		};

		return this.findOne(query, options);
	}

	findOneByImportId(_id, options) {
		const query = {
			importIds: _id
		};

		return this.findOne(query, options);
	}

	findOneByName(name, options) {
		const query = {
			name: name
		};

		return this.findOne(query, options);
	}

	findOneByNameAndType(name, type, options) {
		const query = {
			name: name,
			t: type
		};

		return this.findOne(query, options);
	}

	findOneByIdContainigUsername(_id, username/*, options*/) {
		const record = this.findOneById(_id);
		if (record && record.usernames.indexOf(username) > -1) {
			return record;
		}
	}

	findOneByNameAndTypeNotContainigUsername(name, type, username, options) {
		const query = {
			name: name,
			t: type,
			usernames: {
				$ne: username
			}
		};

		return this.findOne(query, options);
	}

	// FIND
	findById(roomId, options) {
		return this.find({ _id: roomId }, options);
	}

	findByIds(roomIds, options) {
		return this.find({ _id: {$in: [].concat(roomIds)} }, options);
	}

	findByType(type, options) {
		const query = {
			t: type
		};

		return this.find(query, options);
	}

	findByTypes(types, options) {
		const query = {
			t: {
				$in: types
			}
		};

		return this.find(query, options);
	}

	findByUserId(userId, options) {
		const query = {
			'u._id': userId
		};

		return this.find(query, options);
	}

	findByNameContaining(name, options) {
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const query = {
			$or: [{
				name: nameRegex
			}, {
				t: 'd',
				usernames: nameRegex
			}]
		};

		return this.find(query, options);
	}

	findByNameContainingTypesWithUsername(name, types, options) {
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const $or = [];
		types.forEach((type) => {
			const obj = {name: nameRegex, t: type.type};
			if (type.username) {
				obj.usernames = type.username;
			}

			if (type.ids) {
				obj._id = {
					$in: type.ids
				};
			}
			$or.push(obj);
		});

		const query = {
			$or: $or
		};

		return this.find(query, options);
	}

	findContainingTypesWithUsername(types, options) {
		const $or = [];

		types.forEach((type) => {
			const obj = {t: type.type};
			if (type.username) {
				obj.usernames = type.username;
			}

			if (type.ids) {
				obj._id = {
					$in: type.ids
				};
			}

			$or.push(obj);
		});

		const query = {
			$or: $or
		};

		return this.find(query, options);
	}

	findByNameContainingAndTypes(name, types, options) {
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const query = {
			t: {
				$in: types
			},
			$or: [{
				name: nameRegex
			}, {
				t: 'd',
				usernames: nameRegex
			}]
		};

		return this.find(query, options);
	}

	findByNameStartingAndTypes(name, types, options) {
		const nameRegex = new RegExp('^' + s.trim(s.escapeRegExp(name)), 'i');

		const query = {
			t: {
				$in: types
			},
			$or: [{
				name: nameRegex
			}, {
				t: 'd',
				usernames: nameRegex
			}]
		};

		return this.find(query, options);
	}

	findByDefaultAndTypes(defaultValue, types, options) {
		const query = {
			default: defaultValue,
			t: {
				$in: types
			}
		};

		return this.find(query, options);
	}

	findByTypeContainigUsername(type, username, options) {
		const query = {
			t: type,
			usernames: username
		};

		return this.find(query, options);
	}

	findByTypeContainigUsernames(type, username, options) {
		const query = {
			t: type,
			usernames: {
				$all: [].concat(username)
			}
		};

		return this.find(query, options);
	}

	findByTypesAndNotUserIdContainingUsername(types, userId, username, options) {
		const query = {
			t: {
				$in: types
			},
			uid: {
				$ne: userId
			},
			usernames: username
		};

		return this.find(query, options);
	}

	findByContainigUsername(username, options) {
		const query = {
			usernames: username
		};

		return this.find(query, options);
	}

	findByTypeAndName(type, name, options) {
		const query = {
			name: name,
			t: type
		};

		return this.find(query, options);
	}

	findByTypeAndNameContainingUsername(type, name, username, options) {
		const query = {
			name: name,
			t: type,
			usernames: username
		};

		return this.find(query, options);
	}

	findByTypeAndArchivationState(type, archivationstate, options) {
		const query = {
			t: type
		};

		if (archivationstate) {
			query.archived = true;
		} else {
			query.archived = {
				$ne: true
			};
		}

		return this.find(query, options);
	}
});
