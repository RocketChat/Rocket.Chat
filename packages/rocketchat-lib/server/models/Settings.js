class ModelSettings extends RocketChat.models._Base {
	constructor() {
		super(...arguments);

		this.tryEnsureIndex({ 'blocked': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'hidden': 1 }, { sparse: 1 });
	}

	// FIND
	findById(_id) {
		const query = {_id};

		return this.find(query);
	}

	findOneNotHiddenById(_id) {
		const query = {
			_id,
			hidden: { $ne: true }
		};

		return this.findOne(query);
	}

	findByIds(_id = []) {
		_id = [].concat(_id);

		const query = {
			_id: {
				$in: _id
			}
		};

		return this.find(query);
	}

	findByRole(role, options) {
		const query = {role};

		return this.find(query, options);
	}

	findPublic(options) {
		const query = {public: true};

		return this.find(query, options);
	}

	findNotHiddenPublic(ids = []) {
		const filter = {
			hidden: { $ne: true },
			public: true
		};

		if (ids.length > 0) {
			filter._id =
				{$in: ids};
		}

		return this.find(filter, { fields: {_id: 1, value: 1} });
	}

	findNotHiddenPublicUpdatedAfter(updatedAt) {
		const filter = {
			hidden: { $ne: true },
			public: true,
			_updatedAt: {
				$gt: updatedAt
			}
		};

		return this.find(filter, { fields: {_id: 1, value: 1} });
	}

	findNotHiddenPrivate() {
		return this.find({
			hidden: { $ne: true },
			public: { $ne: true }
		});
	}

	findNotHidden(options) {
		return this.find({ hidden: { $ne: true } }, options);
	}

	findNotHiddenUpdatedAfter(updatedAt) {
		return this.find({
			hidden: { $ne: true },
			_updatedAt: {
				$gt: updatedAt
			}
		});
	}

	// UPDATE
	updateValueById(_id, value) {
		const query = {
			blocked: { $ne: true },
			value: { $ne: value },
			_id
		};

		const update = {
			$set: {
				value
			}
		};

		return this.update(query, update);
	}

	updateValueAndEditorById(_id, value, editor) {
		const query = {
			blocked: { $ne: true },
			value: { $ne: value },
			_id
		};

		const update = {
			$set: {
				value,
				editor
			}
		};

		return this.update(query, update);
	}

	updateValueNotHiddenById(_id, value) {
		const query = {
			_id,
			hidden: { $ne: true },
			blocked: { $ne: true }
		};

		const update = {
			$set: {
				value
			}
		};

		return this.update(query, update);
	}

	updateOptionsById(_id, options) {
		const query = {
			blocked: { $ne: true },
			_id
		};

		const update = {$set: options};

		return this.update(query, update);
	}

	// INSERT
	createWithIdAndValue(_id, value) {
		const record = {
			_id,
			value,
			_createdAt: new Date
		};

		return this.insert(record);
	}

	// REMOVE
	removeById(_id) {
		const query = {
			blocked: { $ne: true },
			_id
		};

		return this.remove(query);
	}
}

RocketChat.models.Settings = new ModelSettings('settings', true);
