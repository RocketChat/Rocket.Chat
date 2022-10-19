import _ from 'underscore';
import { LivechatRooms } from '@rocket.chat/models';

import LivechatDepartmentInstance, { LivechatDepartment } from '../../../../../app/models/server/models/LivechatDepartment';
import { getUnitsFromUser } from '../../../livechat-enterprise/server/lib/units';
import { queriesLogger } from '../../../livechat-enterprise/server/lib/logger';
import LivechatUnitMonitors from './LivechatUnitMonitors';

const addQueryRestrictions = (originalQuery = {}) => {
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

export class LivechatUnit extends LivechatDepartment {
	find(originalQuery, ...args) {
		const query = addQueryRestrictions(originalQuery);
		queriesLogger.debug({ msg: 'LivechatUnit.find', query });
		return this.unfilteredFind(query, ...args);
	}

	findOne(originalQuery, ...args) {
		const query = addQueryRestrictions(originalQuery);
		queriesLogger.debug({ msg: 'LivechatUnit.findOne', query });
		return super.unfilteredFindOne(query, ...args);
	}

	findOneById(_id, options) {
		const query = addQueryRestrictions({ _id });
		return super.unfilteredFindOne(query, options);
	}

	update(...args) {
		return this.unfilteredUpdate(...args);
	}

	createOrUpdateUnit(_id, { name, visibility }, ancestors, monitors, departments) {
		monitors = [].concat(monitors || []);
		ancestors = [].concat(ancestors || []);

		const record = {
			name,
			visibility,
			type: 'u',
			numMonitors: monitors.length,
			numDepartments: departments.length,
		};

		if (_id) {
			this.update({ _id }, { $set: record });
		} else {
			_id = this.insert(record);
		}

		ancestors.splice(0, 0, _id);

		const savedMonitors = _.pluck(LivechatUnitMonitors.findByUnitId(_id).fetch(), 'monitorId');
		const monitorsToSave = _.pluck(monitors, 'monitorId');

		// remove other monitors
		_.difference(savedMonitors, monitorsToSave).forEach((monitorId) => {
			LivechatUnitMonitors.removeByUnitIdAndMonitorId(_id, monitorId);
		});

		monitors.forEach((monitor) => {
			LivechatUnitMonitors.saveMonitor({
				monitorId: monitor.monitorId,
				unitId: _id,
				username: monitor.username,
			});
		});

		const savedDepartments = _.pluck(LivechatDepartmentInstance.find({ parentId: _id }).fetch(), '_id');
		const departmentsToSave = _.pluck(departments, 'departmentId');

		// remove other departments
		_.difference(savedDepartments, departmentsToSave).forEach((departmentId) => {
			LivechatDepartmentInstance.update(
				{ _id: departmentId },
				{
					$set: {
						parentId: null,
						ancestors: null,
					},
				},
			);
		});

		departmentsToSave.forEach((departmentId) => {
			LivechatDepartmentInstance.update(
				{ _id: departmentId },
				{
					$set: {
						parentId: _id,
						ancestors,
					},
				},
			);
		});

		Promise.await(LivechatRooms.associateRoomsWithDepartmentToUnit(departmentsToSave, _id));

		return {
			...record,
			...(_id && { _id }),
		};
	}

	// REMOVE
	remove(...args) {
		return this.unfilteredRemove(...args);
	}

	removeParentAndAncestorById(parentId) {
		const query = {
			parentId,
		};

		const update = {
			$unset: { parentId: 1 },
			$pull: { ancestors: parentId },
		};

		return this.update(query, update, { multi: true });
	}

	removeById(_id) {
		LivechatUnitMonitors.removeByUnitId(_id);
		this.removeParentAndAncestorById(_id);
		Promise.await(LivechatRooms.removeUnitAssociationFromRooms(_id));

		const query = { _id };
		return this.remove(query);
	}

	findOneByIdOrName(_idOrName, options) {
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

	findByMonitorId(monitorId) {
		const monitoredUnits = LivechatUnitMonitors.findByMonitorId(monitorId).fetch();
		if (monitoredUnits.length === 0) {
			return [];
		}

		return monitoredUnits.map((u) => u.unitId);
	}

	findMonitoredDepartmentsByMonitorId(monitorId) {
		const monitoredUnits = this.findByMonitorId(monitorId);
		return LivechatDepartmentInstance.findByUnitIds(monitoredUnits);
	}
}

export default new LivechatUnit(LivechatDepartmentInstance.model);
