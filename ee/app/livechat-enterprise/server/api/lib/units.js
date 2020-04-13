import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import LivechatUnit from '../../../../models/server/models/LivechatUnit';
import LivechatUnitMonitors from '../../../../models/server/models/LivechatUnitMonitors';

export async function findUnits({ userId, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'manage-livechat-units')) {
		throw new Error('error-not-authorized');
	}
	const cursor = LivechatUnit.find({}, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = cursor.count();

	const units = cursor.fetch();

	return {
		units,
		count: units.length,
		offset,
		total,
	};
}

export async function findUnitMonitors({ userId, unitId }) {
	if (!await hasPermissionAsync(userId, 'manage-livechat-monitors')) {
		throw new Error('error-not-authorized');
	}
	const monitors = LivechatUnitMonitors.find({ unitId }).fetch();

	return {
		monitors,
	};
}

export async function findUnitById({ userId, unitId }) {
	if (!await hasPermissionAsync(userId, 'manage-livechat-units')) {
		throw new Error('error-not-authorized');
	}
	return LivechatUnit.findOneById(unitId);
}
