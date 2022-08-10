import type { IOmnichannelCannedResponse, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICannedResponseModel } from '@rocket.chat/model-typings';
import type { Db, Collection, IndexDescription, FindOptions, FindCursor, DeleteResult } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class CannedResponse extends BaseRaw<IOmnichannelCannedResponse> implements ICannedResponseModel {
	protected modelIndexes(): IndexDescription[] {
		return [{ key: { shortcut: 1 }, unique: true }];
	}

	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IOmnichannelCannedResponse>>) {
		super(db, 'canned_response', trash);
	}

	async createOrUpdateCannedResponse(
		_id: string,
		{ shortcut, text, tags, scope, userId, departmentId, createdBy, _createdAt }: IOmnichannelCannedResponse,
	): Promise<Omit<IOmnichannelCannedResponse, '_updatedAt'>> {
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
			this.updateOne({ _id }, { $set: record });
		} else {
			_id = (await this.insertOne(record)).insertedId;
		}

		return Object.assign(record, { _id });
	}

	findOneById(id: string, options: FindOptions<IOmnichannelCannedResponse> = {}): Promise<IOmnichannelCannedResponse | null> {
		return this.findOne({ _id: id }, options);
	}

	findOneByShortcut(shortcut: string, options: FindOptions<IOmnichannelCannedResponse> = {}): Promise<IOmnichannelCannedResponse | null> {
		const query = {
			shortcut,
		};

		return this.findOne(query, options);
	}

	findByCannedResponseId(_id: string, options: FindOptions<IOmnichannelCannedResponse> = {}): FindCursor<IOmnichannelCannedResponse> {
		const query = { _id };

		return this.find(query, options);
	}

	findByDepartmentId(departmentId: string, options: FindOptions<IOmnichannelCannedResponse> = {}): FindCursor<IOmnichannelCannedResponse> {
		const query = {
			scope: 'department',
			departmentId,
		};

		return this.find(query, options);
	}

	findByShortcut(shortcut: string, options: FindOptions<IOmnichannelCannedResponse> = {}): FindCursor<IOmnichannelCannedResponse> {
		const query = { shortcut };

		return this.find(query, options);
	}

	// REMOVE
	removeById(_id: string): Promise<DeleteResult> {
		const query = { _id };

		return this.deleteOne(query);
	}
}
