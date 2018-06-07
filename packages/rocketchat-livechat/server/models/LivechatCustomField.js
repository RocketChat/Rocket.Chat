import _ from 'underscore';

/**
 * Livechat Custom Fields model
 */
class LivechatCustomField extends RocketChat.models._Base {
	constructor() {
		super('livechat_custom_field');
	}

	// FIND
	findOneById(_id, options) {
		const query = { _id };

		return this.findOne(query, options);
	}

	createOrUpdateCustomField(_id, field, label, scope, visibility, extraData) {
		const record = {
			label,
			scope,
			visibility
		};

		_.extend(record, extraData);

		if (_id) {
			this.update({ _id }, { $set: record });
		} else {
			record._id = field;
			_id = this.insert(record);
		}

		return record;
	}

	// REMOVE
	removeById(_id) {
		const query = { _id };

		return this.remove(query);
	}
}

RocketChat.models.LivechatCustomField = new LivechatCustomField();
