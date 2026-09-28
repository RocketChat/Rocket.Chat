import type { IOmnichannelBusinessUnit, ILivechatDepartment } from '@rocket.chat/core-typings';
import type { FindPaginated, ILivechatUnitModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import { LivechatUnitMonitors, LivechatDepartment, LivechatRooms, BaseRaw } from '@rocket.chat/models';
import type { Filter, FindCursor, Db, FilterOperators, UpdateResult, DeleteResult, Document, UpdateFilter } from 'mongodb';

const addQueryRestrictions = async (originalQuery: Filter<IOmnichannelBusinessUnit> = {}, unitsFromUser?: string[]) => {
	const query: FilterOperators<IOmnichannelBusinessUnit> = { ...originalQuery, type: 'u' };

	if (Array.isArray(unitsFromUser)) {
		const expressions = query.$and || [];
		const condition = { $or: [{ ancestors: { $in: unitsFromUser } }, { _id: { $in: unitsFromUser } }] };
		query.$and = [condition, ...expressions];
	}

	return query;
};

// We don't actually need Units to extends from Departments
export class LivechatUnitRaw extends BaseRaw<IOmnichannelBusinessUnit> implements ILivechatUnitModel {
	constructor(db: Db) {
		super(db, 'livechat_department');
	}

	findPaginatedUnits<T extends Document = IOmnichannelBusinessUnit, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		query: Filter<IOmnichannelBusinessUnit>,
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<T, O>>> {
		return super.findPaginated<T, O>({ ...query, type: 'u' }, options);
	}

	// @ts-expect-error - Overriding base types :)
	async findOne<P extends Document = IOmnichannelBusinessUnit, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		originalQuery: Filter<IOmnichannelBusinessUnit>,
		options?: O,
		extra?: Record<string, any>,
	): Promise<DocumentWithProjection<P, O> | null> {
		const query = await addQueryRestrictions(originalQuery, extra?.unitsFromUser);
		return super.findOne<P, O>(query, options);
	}

	override async findOneById<
		P extends Document = IOmnichannelBusinessUnit,
		O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>,
	>(_id: IOmnichannelBusinessUnit['_id'], options?: O, extra?: Record<string, any>): Promise<DocumentWithProjection<P, O> | null> {
		return this.findOne<P, O>({ _id }, options, extra);
	}

	async createOrUpdateUnit(
		_id: string | null,
		{ name, visibility }: { name: string; visibility: IOmnichannelBusinessUnit['visibility'] },
		ancestors: string[],
		monitors: { monitorId: string; username: string }[],
		departments: { departmentId: string }[],
	): Promise<Omit<IOmnichannelBusinessUnit, '_updatedAt'>> {
		monitors = ([] as { monitorId: string; username: string }[]).concat(monitors || []);
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
			_id = (await this.insertOne(record)).insertedId;
		}

		if (!_id) {
			throw new Error('Error creating/updating unit');
		}

		ancestors.splice(0, 0, _id);

		const savedMonitors = (await LivechatUnitMonitors.findByUnitId(_id).toArray()).map(({ monitorId }) => monitorId);
		const monitorsToSave = monitors.map(({ monitorId }) => monitorId);

		// remove other monitors
		for await (const monitorId of savedMonitors) {
			if (!monitorsToSave.includes(monitorId)) {
				await LivechatUnitMonitors.removeByUnitIdAndMonitorId(_id, monitorId);
			}
		}

		for await (const monitor of monitors) {
			await LivechatUnitMonitors.saveMonitor({
				monitorId: monitor.monitorId,
				unitId: _id,
				username: monitor.username,
			});
		}

		const savedDepartments = (await LivechatDepartment.findByParentId(_id, { projection: { _id: 1 } }).toArray()).map(({ _id }) => _id);
		const departmentsToSave = departments.map(({ departmentId }) => departmentId);

		// remove other departments
		for await (const departmentId of savedDepartments) {
			if (!departmentsToSave.includes(departmentId)) {
				await LivechatDepartment.removeDepartmentFromUnit(departmentId);
			}
		}

		for await (const departmentId of departmentsToSave) {
			await LivechatDepartment.addDepartmentToUnit(departmentId, _id, ancestors);
		}

		await LivechatRooms.associateRoomsWithDepartmentToUnit(departmentsToSave, _id);

		return {
			...record,
			_id,
		};
	}

	removeParentAndAncestorById(parentId: string): Promise<UpdateResult | Document> {
		const query = {
			parentId,
		};

		const update: UpdateFilter<IOmnichannelBusinessUnit> = {
			$unset: { parentId: 1 },
			$pull: { ancestors: parentId },
		};

		return this.updateMany(query, update);
	}

	incrementDepartmentsCount(_id: string): Promise<UpdateResult | Document> {
		return this.updateOne({ _id }, { $inc: { numDepartments: 1 } });
	}

	decrementDepartmentsCount(_id: string): Promise<UpdateResult | Document> {
		return this.updateOne({ _id }, { $inc: { numDepartments: -1 } });
	}

	override async removeById(_id: string): Promise<DeleteResult> {
		await LivechatUnitMonitors.removeByUnitId(_id);
		await this.removeParentAndAncestorById(_id);
		await LivechatRooms.removeUnitAssociationFromRooms(_id);

		const query = { _id };
		return this.deleteOne(query);
	}

	async removeByIdAndUnit(_id: string, unitsFromUser?: string[]): Promise<DeleteResult> {
		const originalQuery = { _id };
		const query = await addQueryRestrictions(originalQuery, unitsFromUser);
		const result = await this.deleteOne(query);
		if (result.deletedCount > 0) {
			await LivechatUnitMonitors.removeByUnitId(_id);
			await this.removeParentAndAncestorById(_id);
			await LivechatRooms.removeUnitAssociationFromRooms(_id);
		}

		return result;
	}

	findOneByIdOrName<T extends Document = IOmnichannelBusinessUnit, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_idOrName: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
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

		return this.findOne<T, O>(query, options);
	}

	async findByMonitorId(monitorId: string): Promise<string[]> {
		const monitoredUnits = await LivechatUnitMonitors.findByMonitorId(monitorId).toArray();
		if (monitoredUnits.length === 0) {
			return [];
		}

		return monitoredUnits.map((u) => u.unitId);
	}

	async findMonitoredDepartmentsByMonitorId(monitorId: string, includeDisabled: boolean): Promise<ILivechatDepartment[]> {
		const monitoredUnits = await this.findByMonitorId(monitorId);

		if (includeDisabled) {
			return LivechatDepartment.findByUnitIds(monitoredUnits, {}).toArray();
		}
		return LivechatDepartment.findActiveByUnitIds(monitoredUnits, {}).toArray();
	}

	countUnits(): Promise<number> {
		return this.countDocuments({ type: 'u' });
	}
}
