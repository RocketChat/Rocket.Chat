import type { IOmnichannelBusinessUnit, ILivechatUnitMonitor } from '@rocket.chat/core-typings';
import { LivechatUnitMonitors, LivechatUnit } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { FindOptions } from 'mongodb';

export async function findUnitsOfUser({
	text,
	userId,
	pagination: { offset, count, sort },
}: {
	text?: string;
	userId: string;
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

	// TODO: an aggregation woudl be faster? or nah?
	const myUnits = await LivechatUnitMonitors.findByMonitorId(userId)
		.map((u) => u.unitId)
		.toArray();
	const query = { _id: { $in: myUnits }, ...(text && { $or: [{ name: filter }] }) };

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

export async function findUnits({
	text,
	pagination: { offset, count, sort },
}: {
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

export async function findUnitMonitors({ unitId }: { unitId: string }): Promise<ILivechatUnitMonitor[]> {
	return LivechatUnitMonitors.find({ unitId }).toArray();
}

export async function findUnitById({ unitId }: { unitId: string }): Promise<IOmnichannelBusinessUnit | null> {
	return LivechatUnit.findOneById<IOmnichannelBusinessUnit>(unitId);
}
