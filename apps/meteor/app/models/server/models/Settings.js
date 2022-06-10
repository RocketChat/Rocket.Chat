import { Meteor } from 'meteor/meteor';

import { Base } from './_Base';

export class Settings extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ blocked: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ hidden: 1 }, { sparse: 1 });

		const collectionObj = this.model.rawCollection();
		this.findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);
	}

	// FIND
	findById(_id) {
		const query = { _id };

		return this.find(query);
	}

	findOneNotHiddenById(_id) {
		const query = {
			_id,
			hidden: { $ne: true },
		};

		return this.findOne(query);
	}

	findByIds(_id = []) {
		_id = [].concat(_id);

		const query = {
			_id: {
				$in: _id,
			},
		};

		return this.find(query);
	}

	findPublic(options) {
		const query = { public: true };

		return this.find(query, options);
	}

	findNotHiddenPublic(ids = []) {
		const filter = {
			hidden: { $ne: true },
			public: true,
		};

		if (ids.length > 0) {
			filter._id = { $in: ids };
		}

		return this.find(filter, {
			fields: {
				_id: 1,
				value: 1,
				editor: 1,
				enterprise: 1,
				invalidValue: 1,
				modules: 1,
				requiredOnWizard: 1,
			},
		});
	}

	findNotHiddenPublicUpdatedAfter(updatedAt) {
		const filter = {
			hidden: { $ne: true },
			public: true,
			_updatedAt: {
				$gt: updatedAt,
			},
		};

		return this.find(filter, {
			fields: {
				_id: 1,
				value: 1,
				editor: 1,
				enterprise: 1,
				invalidValue: 1,
				modules: 1,
				requiredOnWizard: 1,
			},
		});
	}

	findNotHiddenPrivate() {
		return this.find({
			hidden: { $ne: true },
			public: { $ne: true },
		});
	}

	findNotHidden({ updatedAfter, ...options } = {}) {
		const query = {
			hidden: { $ne: true },
		};

		if (updatedAfter) {
			query._updatedAt = { $gt: updatedAfter };
		}

		return this.find(query, options);
	}

	findNotHiddenUpdatedAfter(updatedAt) {
		return this.find({
			hidden: { $ne: true },
			_updatedAt: {
				$gt: updatedAt,
			},
		});
	}

	findSetupWizardSettings() {
		return this.find({ wizard: { $exists: true, $ne: null } });
	}

	findEnterpriseSettings() {
		return this.find({ enterprise: true });
	}

	// UPDATE
	updateValueById(_id, value) {
		const query = {
			blocked: { $ne: true },
			value: { $ne: value },
			_id,
		};

		const update = {
			$set: {
				value,
			},
		};

		return this.update(query, update);
	}

	incrementValueById(_id, value = 1) {
		const query = {
			blocked: { $ne: true },
			_id,
		};

		const update = {
			$inc: {
				value,
			},
		};

		return this.update(query, update);
	}

	updateValueAndEditorById(_id, value, editor) {
		const query = {
			blocked: { $ne: true },
			value: { $ne: value },
			_id,
		};

		const update = {
			$set: {
				value,
				editor,
			},
		};

		return this.update(query, update);
	}

	updateValueNotHiddenById(_id, value) {
		const query = {
			_id,
			hidden: { $ne: true },
			blocked: { $ne: true },
		};

		const update = {
			$set: {
				value,
			},
		};

		return this.update(query, update);
	}

	updateOptionsById(_id, options) {
		const query = {
			blocked: { $ne: true },
			_id,
		};

		const update = { $set: options };

		return this.update(query, update);
	}

	addOptionValueById(_id, option = {}) {
		const query = {
			blocked: { $ne: true },
			_id,
		};

		const { key, i18nLabel } = option;
		const update = {
			$addToSet: {
				values: {
					key,
					i18nLabel,
				},
			},
		};

		return this.update(query, update);
	}

	removeOptionValueByIdAndKey(_id, key) {
		const query = {
			blocked: { $ne: true },
			_id,
		};

		const update = {
			$pull: {
				values: { key },
			},
		};

		return this.update(query, update);
	}

	// INSERT
	createWithIdAndValue(_id, value) {
		const record = {
			_id,
			value,
			_createdAt: new Date(),
		};

		return this.insert(record);
	}

	// REMOVE
	removeById(_id) {
		const query = {
			blocked: { $ne: true },
			_id,
		};

		return this.remove(query);
	}

	// RENAME SETTING
	renameSetting(oldId, newId) {
		const oldSetting = this.findById(oldId).fetch()[0];
		if (oldSetting) {
			this.removeById(oldSetting._id);
			// there has been some problem with upsert() when changing the complete doc, so decide explicitly for insert or update
			let newSetting = this.findById(newId).fetch()[0];
			if (newSetting) {
				this.updateValueById(newId, oldSetting.value);
			} else {
				newSetting = oldSetting;
				newSetting._id = newId;
				delete newSetting.$loki;
				this.insert(newSetting);
			}
		}
	}

	insert(record, ...args) {
		return super.insert({ createdAt: new Date(), ...record }, ...args);
	}
}

export default new Settings('settings', true);
