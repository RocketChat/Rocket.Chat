import _ from 'underscore';

import { Base } from '../../../../../app/models';
/**
 * Livechat Tag model
 */
export class LivechatTag extends Base {
	constructor(modelOrName) {
		super(modelOrName || 'livechat_tag');

		this.tryEnsureIndex({ name: 1 }, { unique: true });
	}

	// FIND
	findOneById(_id, options) {
		const query = { _id };

		return this.findOne(query, options);
	}

	createOrUpdateTag(_id, { name, description }, departments = []) {
		const record = {
			name,
			description,
			numDepartments: departments.length,
			departments,
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

export default new LivechatTag();
