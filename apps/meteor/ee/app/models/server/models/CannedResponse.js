import _ from 'underscore';

import { Base } from '../../../../../app/models';
/**
 * Livechat Department model
 */
export class CannedResponse extends Base {
	constructor() {
		super('canned_response');

		this.tryEnsureIndex(
			{
				shortcut: 1,
			},
			{ unique: true },
		);
	}

	createOrUpdateCannedResponse(_id, { shortcut, text, tags, scope, userId, departmentId, createdBy, _createdAt }) {
		const record = {
			shortcut,
			text,
			scope,
			tags,
			userId,
			departmentId,
			createdBy,
			_createdAt,
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

	findOneByShortcut(shortcut, options) {
		const query = {
			shortcut,
		};

		return this.findOne(query, options);
	}

	findByCannedResponseId(_id, options) {
		const query = { _id };

		return this.find(query, options);
	}

	findByDepartmentId(departmentId, options) {
		const query = {
			scope: 'department',
			departmentId,
		};

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
