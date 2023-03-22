import _ from 'underscore';

import { Base } from '../../../../../app/models/server';
/**
 * Livechat Department model
 */
class CannedResponse extends Base {
	constructor() {
		super('canned_response');

		this.tryEnsureIndex(
			{
				shortcut: 1,
			},
			{ unique: true },
		);
	}

	/**
	 * Create or update a canned response
	 * @param {string} [_id]
	 * @param {object} cannedResponseData
	 * @param {string} cannedResponseData.shortcut
	 * @param {string} cannedResponseData.text
	 * @param {any} cannedResponseData.tags
	 * @param {string} cannedResponseData.scope
	 * @param {string} [cannedResponseData.userId]
	 * @param {string} [cannedResponseData.departmentId]
	 * @param {{ _id: string; username: string; }} [cannedResponseData.createdBy]
	 * @param {Date} [cannedResponseData._createdAt]
	 */
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
