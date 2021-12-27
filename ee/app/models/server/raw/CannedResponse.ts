import _ from 'underscore';
import { Cursor, FindOneOptions } from 'mongodb';

import { BaseRaw } from '../../../../../app/models/server/raw/BaseRaw';
import CannedResponse from '../models/CannedResponse';
import { IOmnichannelCannedResponse } from '../../../../../definition/IOmnichannelCannedResponse';


export class CannedResponseRaw extends BaseRaw<IOmnichannelCannedResponse> {
	async createOrUpdateCannedResponse(_id: string, { shortcut, text, tags, scope, userId, departmentId, createdBy, _createdAt }: Omit<IOmnichannelCannedResponse, '_id' | '_updatedAt'>): Promise<IOmnichannelCannedResponse> {
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
			await this.update({ _id }, { $set: record });
		} else {
			_id = await (await this.insertOne(record)).insertedId;
		}

		return _.extend(record, { _id });
	}

	findOneByShortcut(shortcut: string, options: FindOneOptions<IOmnichannelCannedResponse>): Promise<IOmnichannelCannedResponse | null> {
		const query = {
			shortcut,
		};

		return this.findOne(query, options);
	}

	findByCannedResponseId(_id: string, options: FindOneOptions<IOmnichannelCannedResponse> = {}): Cursor<IOmnichannelCannedResponse> {
		const query = { _id };

		return this.find(query, options);
	}

	findByDepartmentId(departmentId: string, options: FindOneOptions<IOmnichannelCannedResponse> = {}): Cursor<IOmnichannelCannedResponse> {
		const query = {
			scope: 'department',
			departmentId,
		};

		return this.find(query, options);
	}

	findByShortcut(shortcut: string, options: FindOneOptions<IOmnichannelCannedResponse> = {}): Cursor<IOmnichannelCannedResponse> {
		const query = { shortcut };

		return this.find(query, options);
	}
}

export default new CannedResponseRaw(CannedResponse.model.rawCollection());
