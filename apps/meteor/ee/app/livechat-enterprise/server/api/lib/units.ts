import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { IOmnichannelBusinessUnit, ILivechatMonitor } from '@rocket.chat/core-typings';
import { LivechatUnitMonitors, LivechatUnit } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';

export async function findUnits({
	text,
	pagination: { offset, count, sort },
}: {
	userId: string;
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: FindOptions<IOmnichannelBusinessUnit>['sort'];
	};
}): Promise<{
	units: IOmnichannelBusinessUnit[];
	count: number;
	offset: number;
	total: number;
}> {
	const filter = text && new RegExp(escapeRegExp(text), 'i');

	const query = { ...(text && { $or: [{ name: filter }] }) };

	const { cursor, totalCount } = LivechatUnit.findPaginatedUnits(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const [units, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		units,
		count: units.length,
		offset,
		total,
	};
}

export async function findUnitMonitors({ unitId }: { userId: string; unitId: string }): Promise<ILivechatMonitor[]> {
	return LivechatUnitMonitors.find({ unitId }).toArray() as Promise<ILivechatMonitor[]>;
}

export async function findUnitById({ userId, unitId }: { userId: string; unitId: string }): Promise<IOmnichannelBusinessUnit | null> {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-units'))) {
		throw new Error('error-not-authorized');
	}
	return LivechatUnit.findOneById<IOmnichannelBusinessUnit>(unitId);
}
