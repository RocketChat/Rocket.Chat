import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import type { ICannedResponseModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import { BaseRaw } from '@rocket.chat/models';
import type { Db, DeleteResult, FindCursor, IndexDescription, UpdateFilter, Document } from 'mongodb';

// TODO need to define type for CannedResponse object
export class CannedResponseRaw extends BaseRaw<IOmnichannelCannedResponse> implements ICannedResponseModel {
	constructor(db: Db) {
		super(db, 'canned_response');
	}

	protected override modelIndexes(): IndexDescription[] {
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

	override findOneById<
		P extends Document = IOmnichannelCannedResponse,
		O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>,
	>(_id: string, options?: O): Promise<DocumentWithProjection<P, O> | null> {
		const query = { _id };

		return this.findOne<P, O>(query, options);
	}

	findOneByShortcut<T extends Document = IOmnichannelCannedResponse, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		shortcut: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		const query = {
			shortcut,
		};

		return this.findOne<T, O>(query, options);
	}

	findByDepartmentId<
		T extends Document = IOmnichannelCannedResponse,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(departmentId: string, options?: O): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			scope: 'department',
			departmentId,
		};

		return this.find<T, O>(query, options);
	}

	// REMOVE
	override removeById(_id: string): Promise<DeleteResult> {
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
