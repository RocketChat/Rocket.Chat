import _ from 'underscore';

import { Base } from '../../../../../app/models';
/**
 * Livechat Priority model
 */
export class LivechatPriority extends Base {
	constructor() {
		super('livechat_priority');

		this.tryEnsureIndex({ name: 1 }, { unique: true });
	}

	// FIND
	findOneById(_id, options) {
		const query = { _id };

		return this.findOne(query, options);
	}

	createOrUpdatePriority(_id, { name, description }) {
		const record = {
			name,
			description,
		};

		if (_id) {
			this.update({ _id }, { $set: record });
		} else {
			_id = this.insert(record);
		}

		return _.extend(record, { _id });
	}

	// REMOVE
	removeById(_id) {
		const query = { _id };

		return this.remove(query);
	}

}

export default new LivechatPriority();
