import _ from 'underscore';

import { Base } from '../../../../../app/models';
/**
 * Livechat Department model
 */
export class CannedResponse extends Base {
	constructor() {
		super('canned_response');

		this.tryEnsureIndex({
			shortcut: 1,
		});
	}

	createOrUpdateCannedResponse(_id, { shortcut, text, scope, userId, departmentId, createdBy }) {
		const record = {
			shortcut,
			text,
			scope,
			userId,
			departmentId,
			createdBy,
		};

		if (_id) {
			this.update({ _id }, { $set: record });
		} else {
			_id = this.insert(record);
		}

		return _.extend(record, { _id });
	}

	// FIND
	findOneById(_id, options) {
		const query = { _id };

		return this.findOne(query, options);
	}

	findByCannedResponseId(_id, options) {
		const query = { _id };

		return this.find(query, options);
	}

	findByShortcut(shortcut, options) {
		const query = { shortcut };

		return this.find(query, options);
	}

	// REMOVE
	removeById(_id) {
		const query = { _id };

		return this.remove(query);
	}
}

export default new CannedResponse();
