import _ from 'underscore';

import { Base } from './_Base';

/**
 * Livechat Custom Fields model
 */
export class LivechatCustomField extends Base {
	constructor() {
		super('livechat_custom_field');

		this.tryEnsureIndex({ scope: 1 });
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
			visibility,
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

export default new LivechatCustomField();
