import { escapeRegExp } from '@rocket.chat/string-helpers';
import { FindOneOptions, Cursor, FilterQuery, WriteOpResult } from 'mongodb';
import type { ILivechatDepartmentRecord } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

export class LivechatDepartmentRaw extends BaseRaw<ILivechatDepartmentRecord> {
	findInIds(departmentsIds: string[], options: FindOneOptions<ILivechatDepartmentRecord>): Cursor<ILivechatDepartmentRecord> {
		const query = { _id: { $in: departmentsIds } };
		return this.find(query, options);
	}

	findByNameRegexWithExceptionsAndConditions(
		searchTerm: string,
		exceptions: string[] = [],
		conditions: FilterQuery<ILivechatDepartmentRecord> = {},
		options: FindOneOptions<ILivechatDepartmentRecord> = {},
	): Cursor<ILivechatDepartmentRecord> {
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

	findByBusinessHourId(businessHourId: string, options: FindOneOptions<ILivechatDepartmentRecord>): Cursor<ILivechatDepartmentRecord> {
		const query = { businessHourId };
		return this.find(query, options);
	}

	findEnabledByBusinessHourId(
		businessHourId: string,
		options: FindOneOptions<ILivechatDepartmentRecord>,
	): Cursor<ILivechatDepartmentRecord> {
		const query = { businessHourId, enabled: true };
		return this.find(query, options);
	}

	findEnabledByListOfBusinessHourIdsAndDepartmentIds(
		businessHourIds: string[],
		departmentIds: string[],
		options: FindOneOptions<ILivechatDepartmentRecord>,
	): Cursor<ILivechatDepartmentRecord> {
		const query: FilterQuery<ILivechatDepartmentRecord> = {
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

	addBusinessHourToDepartmentsByIds(ids: string[] = [], businessHourId: string): Promise<WriteOpResult> {
		const query = {
			_id: { $in: ids },
		};

		const update = {
			$set: {
				businessHourId,
			},
		};

		return this.col.update(query, update, { multi: true });
	}

	removeBusinessHourFromDepartmentsByIdsAndBusinessHourId(ids: string[] = [], businessHourId: string): Promise<WriteOpResult> {
		const query = {
			_id: { $in: ids },
			businessHourId,
		};

		const update = {
			$unset: {
				businessHourId: 1,
			},
		};

		return this.col.update(query, update, { multi: true });
	}

	removeBusinessHourFromDepartmentsByBusinessHourId(businessHourId: string): Promise<WriteOpResult> {
		const query = {
			businessHourId,
		};

		const update = {
			$unset: {
				businessHourId: 1,
			},
		};

		return this.col.update(query, update, { multi: true });
	}
}
