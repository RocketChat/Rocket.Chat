import type { ILivechatUnitModel } from '@rocket.chat/model-typings';
import { LivechatUnitMonitors } from '@rocket.chat/models';
import type { IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import type { Filter, FindCursor, FindOptions, FindOneOptions, UpdateResult, Document, DeleteResult } from 'mongodb';
import _ from 'underscore';

import { LivechatDepartmentRaw } from '../../../../server/models/raw/LivechatDepartment';
import { getUnitsFromUser } from '../../../app/livechat-enterprise/server/lib/units';
import { queriesLogger } from '../../../app/livechat-enterprise/server/lib/logger';

// We need to manipulate the query, forgive me for this
const addQueryRestrictions = (originalQuery: any) => {
	const query = { ...originalQuery, type: 'u' };

	const units = getUnitsFromUser();
	if (Array.isArray(units)) {
		query.ancestors = { $in: units };
		const expressions = query.$and || [];
		const condition = { $or: [{ ancestors: { $in: units } }, { _id: { $in: units } }] };
		query.$and = [condition, ...expressions];
	}

	return query;
};

export class LivechatUnitRaw extends LivechatDepartmentRaw implements ILivechatUnitModel {
	unfilteredFind = super.find;

	find(
		originalQuery: Filter<IOmnichannelBusinessUnit>,
		options: FindOptions<IOmnichannelBusinessUnit> = {},
	): FindCursor<IOmnichannelBusinessUnit> {
		const query = addQueryRestrictions(originalQuery);
		queriesLogger.debug({ msg: 'LivechatUnit.find', query });
		return super.find(query, options);
	}

	findOne(originalQuery: Filter<IOmnichannelBusinessUnit>, options: FindOptions<IOmnichannelBusinessUnit> = {}) {
		const query = addQueryRestrictions(originalQuery);
		queriesLogger.debug({ msg: 'LivechatUnit.findOne', query });
		return super.findOne(query, options);
	}

	findOneById(_id: string, options: FindOneOptions<IOmnichannelBusinessUnit>) {
		const query = addQueryRestrictions({ _id });
		return super.findOne(query, options);
	}

	findOneByIdOrName(_idOrName: string, options: FindOneOptions<IOmnichannelBusinessUnit> = {}): Promise<IOmnichannelBusinessUnit | null> {
		const query = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
	}

	async findByMonitorId(monitorId: string): Promise<string[]> {
		const monitoredUnits = await LivechatUnitMonitors.findByMonitorId(monitorId).toArray();
		if (monitoredUnits.length === 0) {
			return [];
		}

		// @ts-expect-error - will fix the type later
		return monitoredUnits.map((u) => u.unitId);
	}

	update(query: Filter<IOmnichannelBusinessUnit>, update: Partial<IOmnichannelBusinessUnit>): Promise<Document | UpdateResult> {
		return super.updateMany(query, update);
	}

	remove(query: Filter<IOmnichannelBusinessUnit>): Promise<Document | DeleteResult> {
		return super.deleteMany(query);
	}

	removeParentAndAncestorById(parentId: string): Promise<UpdateResult | Document> {
		const query = {
			parentId,
		};

		const update = {
			$unset: { parentId: 1 },
			$pull: { ancestors: parentId },
		};

		return this.updateMany(query, update);
	}

	async removeById(_id: string): Promise<DeleteResult> {
		await LivechatUnitMonitors.removeByUnitId(_id);
		await this.removeParentAndAncestorById(_id);

		const query = { _id };
		return this.deleteOne(query);
	}

	async findMonitoredDepartmentsByMonitorId(monitorId: string): Promise<FindCursor<IOmnichannelBusinessUnit>> {
		const monitoredUnits = await this.findByMonitorId(monitorId);
		return this.findByUnitIds(monitoredUnits, {}) as unknown as FindCursor<IOmnichannelBusinessUnit>;
	}

	async createOrUpdateUnit(
		_id: string,
		{ name, visibility }: { name: string; visibility: string },
		ancestors: string[],
		monitors: { monitorId: string; username: string }[],
		departments: string[],
	): Promise<IOmnichannelBusinessUnit> {
		monitors = ([] as any[]).concat(monitors || []);
		ancestors = ([] as string[]).concat(ancestors || []);

		const record = {
			name,
			visibility,
			type: 'u',
			numMonitors: monitors.length,
			numDepartments: departments.length,
		};

		if (_id) {
			await this.updateOne({ _id }, { $set: record });
		} else {
			// @ts-expect-error someone decided that units are departments instead of creating a new collection :(
			_id = (await this.insertOne(record)).insertedId;
		}

		ancestors.splice(0, 0, _id);

		const savedMonitors = _.pluck(await LivechatUnitMonitors.findByUnitId(_id).toArray(), 'monitorId');
		const monitorsToSave = _.pluck(monitors, 'monitorId');

		// remove other monitors
		await Promise.all(
			_.difference(savedMonitors, monitorsToSave).map(async (monitorId) => {
				await LivechatUnitMonitors.removeByUnitIdAndMonitorId(_id, monitorId);
			}),
		);

		await Promise.all(
			monitors.map(async (monitor) => {
				await LivechatUnitMonitors.saveMonitor({
					monitorId: monitor.monitorId,
					unitId: _id,
					username: monitor.username,
				});
			}),
		);

		const savedDepartments = _.pluck(await super.find({ parentId: _id }).toArray(), '_id');
		const departmentsToSave = _.pluck(departments, 'departmentId');

		// remove other departments
		await Promise.all(
			_.difference(savedDepartments, departmentsToSave).map(async (departmentId) => {
				await super.updateOne(
					{ _id: departmentId },
					{
						$set: {
							parentId: null,
							ancestors: null,
						},
					},
				);
			}),
		);

		await Promise.all(
			departmentsToSave.map(async (departmentId) => {
				await super.updateOne(
					{ _id: departmentId },
					{
						$set: {
							parentId: _id,
							ancestors,
						},
					},
				);
			}),
		);

		return _.extend(record, { _id });
	}
}
