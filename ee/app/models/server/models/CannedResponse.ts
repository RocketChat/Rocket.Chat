import { DeleteWriteOpResultObject, FindOneOptions } from 'mongodb';
import _ from 'underscore';

import { Base } from '../../../../../app/models/server';
import { IOmnichannelCannedResponse } from '../../../../../definition/IOmnichannelCannedResponse';
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

	createOrUpdateCannedResponse(_id: string, { shortcut, text, tags, scope, userId, departmentId, createdBy, _createdAt }: Partial<IOmnichannelCannedResponse>): IOmnichannelCannedResponse {
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
	findOneById(_id: string, options?: FindOneOptions<IOmnichannelCannedResponse>): IOmnichannelCannedResponse | null {
		const query = { _id };

		return this.findOne(query, options);
	}

	findOneByShortcut(shortcut: string, options: FindOneOptions<IOmnichannelCannedResponse>): IOmnichannelCannedResponse | null {
		const query = {
			shortcut,
		};

		return this.findOne(query, options);
	}

	findByCannedResponseId(_id: string, options?: FindOneOptions<IOmnichannelCannedResponse>): IOmnichannelCannedResponse[] {
		const query = { _id };

		return this.find(query, options);
	}

	findByDepartmentId(departmentId: string, options?: FindOneOptions<IOmnichannelCannedResponse>): IOmnichannelCannedResponse[] {
		const query = {
			scope: 'department',
			departmentId,
		};

		return this.find(query, options);
	}

	findByShortcut(shortcut: string, options?: FindOneOptions<IOmnichannelCannedResponse>): IOmnichannelCannedResponse[] {
		const query = { shortcut };

		return this.find(query, options);
	}

	// REMOVE
	removeById(_id: string): DeleteWriteOpResultObject {
		const query = { _id };

		return this.remove(query);
	}
}

export default new CannedResponse();
