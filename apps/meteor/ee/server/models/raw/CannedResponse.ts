import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import type { ICannedResponseModel } from '@rocket.chat/model-typings';
import { BaseRaw } from '@rocket.chat/models';
import type { Db, DeleteResult, FindCursor, FindOptions, IndexDescription, UpdateFilter } from 'mongodb';

// TODO need to define type for CannedResponse object
export class CannedResponseRaw extends BaseRaw<IOmnichannelCannedResponse> implements ICannedResponseModel {
	constructor(db: Db) {
		super(db, 'canned_response');
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{
				key: {
					shortcut: 1,
				},
				unique: true,
			},
		];
	}

	async updateCannedResponse(
		_id: string,
		{ shortcut, text, tags, scope, userId, departmentId, createdBy }: Omit<IOmnichannelCannedResponse, '_id' | '_updatedAt' | '_createdAt'>,
	): Promise<Omit<IOmnichannelCannedResponse, '_updatedAt' | '_createdAt'>> {
		const record = {
			shortcut,
			text,
			scope,
			tags,
			userId,
			departmentId,
			createdBy,
		};

		await this.updateOne({ _id }, { $set: record });

		return Object.assign(record, { _id });
	}

	async createCannedResponse({
		shortcut,
		text,
		tags,
		scope,
		userId,
		departmentId,
		createdBy,
		_createdAt,
	}: Omit<IOmnichannelCannedResponse, '_id' | '_updatedAt'>): Promise<Omit<IOmnichannelCannedResponse, '_updatedAt'>> {
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

		const _id = (await this.insertOne(record)).insertedId;
		return Object.assign(record, { _id });
	}

	findOneById(_id: string, options?: FindOptions<IOmnichannelCannedResponse>): Promise<IOmnichannelCannedResponse | null> {
		const query = { _id };

		return this.findOne(query, options);
	}

	findOneByShortcut(shortcut: string, options?: FindOptions<IOmnichannelCannedResponse>): Promise<IOmnichannelCannedResponse | null> {
		const query = {
			shortcut,
		};

		return this.findOne(query, options);
	}

	findByCannedResponseId(_id: string, options?: FindOptions<IOmnichannelCannedResponse>): FindCursor<IOmnichannelCannedResponse> {
		const query = { _id };

		return this.find(query, options);
	}

	findByDepartmentId(departmentId: string, options?: FindOptions<IOmnichannelCannedResponse>): FindCursor<IOmnichannelCannedResponse> {
		const query = {
			scope: 'department',
			departmentId,
		};

		return this.find(query, options);
	}

	findByShortcut(shortcut: string, options?: FindOptions<IOmnichannelCannedResponse>): FindCursor<IOmnichannelCannedResponse> {
		const query = { shortcut };

		return this.find(query, options);
	}

	// REMOVE
	removeById(_id: string): Promise<DeleteResult> {
		const query = { _id };

		return this.deleteOne(query);
	}

	removeTagFromCannedResponses(tagId: string) {
		const update: UpdateFilter<IOmnichannelCannedResponse> = {
			$pull: {
				tags: tagId,
			},
		};

		return this.updateMany({ tags: tagId }, update);
	}
}
