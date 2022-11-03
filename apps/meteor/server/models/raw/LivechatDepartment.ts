import type { ILivechatDepartmentRecord, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatDepartmentModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, Filter, FindOptions, UpdateResult, Document } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { BaseRaw } from './BaseRaw';

export class LivechatDepartmentRaw extends BaseRaw<ILivechatDepartmentRecord> implements ILivechatDepartmentModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatDepartmentRecord>>) {
		super(db, 'livechat_department', trash);
	}

	findInIds(departmentsIds: string[], options: FindOptions<ILivechatDepartmentRecord>): FindCursor<ILivechatDepartmentRecord> {
		const query = { _id: { $in: departmentsIds } };
		return this.find(query, options);
	}

	findByNameRegexWithExceptionsAndConditions(
		searchTerm: string,
		exceptions: string[] = [],
		conditions: Filter<ILivechatDepartmentRecord> = {},
		options: FindOptions<ILivechatDepartmentRecord> = {},
	): FindCursor<ILivechatDepartmentRecord> {
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const nameRegex = new RegExp(`^${escapeRegExp(searchTerm).trim()}`, 'i');

		const query = {
			name: nameRegex,
			_id: {
				$nin: exceptions,
			},
			...conditions,
		};

		return this.find(query, options);
	}

	findByBusinessHourId(businessHourId: string, options: FindOptions<ILivechatDepartmentRecord>): FindCursor<ILivechatDepartmentRecord> {
		const query = { businessHourId };
		return this.find(query, options);
	}

	findEnabledByBusinessHourId(
		businessHourId: string,
		options: FindOptions<ILivechatDepartmentRecord>,
	): FindCursor<ILivechatDepartmentRecord> {
		const query = { businessHourId, enabled: true };
		return this.find(query, options);
	}

	findEnabledByListOfBusinessHourIdsAndDepartmentIds(
		businessHourIds: string[],
		departmentIds: string[],
		options: FindOptions<ILivechatDepartmentRecord>,
	): FindCursor<ILivechatDepartmentRecord> {
		const query: Filter<ILivechatDepartmentRecord> = {
			enabled: true,
			businessHourId: {
				$in: businessHourIds,
			},
			_id: {
				$in: departmentIds,
			},
		};
		return this.find(query, options);
	}

	addBusinessHourToDepartmentsByIds(ids: string[] = [], businessHourId: string): Promise<Document | UpdateResult> {
		const query = {
			_id: { $in: ids },
		};

		const update = {
			$set: {
				businessHourId,
			},
		};

		return this.updateMany(query, update);
	}

	removeBusinessHourFromDepartmentsByIdsAndBusinessHourId(ids: string[] = [], businessHourId: string): Promise<Document | UpdateResult> {
		const query = {
			_id: { $in: ids },
			businessHourId,
		};

		const update = {
			$unset: {
				businessHourId: 1,
			},
		};

		return this.updateMany(query, update);
	}

	removeBusinessHourFromDepartmentsByBusinessHourId(businessHourId: string): Promise<Document | UpdateResult> {
		const query = {
			businessHourId,
		};

		const update = {
			$unset: {
				businessHourId: 1,
			},
		};

		return this.updateMany(query, update);
	}
}
