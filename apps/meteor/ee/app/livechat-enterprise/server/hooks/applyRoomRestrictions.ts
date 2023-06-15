import type { FilterOperators } from 'mongodb';
import type { IOmnichannelRoom } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';
import { getUnitsFromUser } from '../lib/units';

export const restrictQuery = async (originalQuery: FilterOperators<IOmnichannelRoom> = {}) => {
	const query = { ...originalQuery };

	const units = await getUnitsFromUser();
	if (!Array.isArray(units)) {
		return query;
	}

	const expressions = query.$and || [];
	const condition = {
		$or: [{ departmentAncestors: { $in: units } }, { departmentId: { $in: units } }],
	};
	query.$and = [condition, ...expressions];

	return query;
};

callbacks.add(
	'livechat.applyRoomRestrictions',
	async (originalQuery: FilterOperators<IOmnichannelRoom> = {}) => {
		cbLogger.debug('Applying room query restrictions');
		return restrictQuery(originalQuery);
	},
	callbacks.priority.HIGH,
	'livechat-apply-room-restrictions',
);
