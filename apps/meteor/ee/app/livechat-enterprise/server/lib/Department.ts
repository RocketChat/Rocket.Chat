import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Filter } from 'mongodb';

import { callbacks } from '../../../../../lib/callbacks';

export const findAllDepartmentsAvailable = async (
	uid: string,
	unitId: string,
	offset: number,
	count: number,
	text?: string,
	onlyMyDepartments = false,
): Promise<{ departments: ILivechatDepartment[]; total: number }> => {
	const filterReg = new RegExp(escapeRegExp(text || ''), 'i');

	let query: Filter<ILivechatDepartment> = {
		type: { $ne: 'u' },
		$or: [{ ancestors: { $in: [[unitId], undefined, []] } }, { ancestors: { $exists: false } }],
		...(text && { name: filterReg }),
	};

	if (onlyMyDepartments) {
		query = await callbacks.run('livechat.applyDepartmentRestrictions', query, { userId: uid });
	}

	const { cursor, totalCount } = LivechatDepartment.findPaginated(query, { limit: count, offset, sort: { name: 1 } });

	const [departments, total] = await Promise.all([cursor.toArray(), totalCount]);

	return { departments, total };
};

export const findAllDepartmentsByUnit = async (
	unitId: string,
	offset: number,
	count: number,
): Promise<{ departments: ILivechatDepartment[]; total: number }> => {
	const { cursor, totalCount } = LivechatDepartment.findPaginated(
		{
			ancestors: { $in: [unitId] },
		},
		{ limit: count, offset },
	);

	const [departments, total] = await Promise.all([cursor.toArray(), totalCount]);

	return { departments, total };
};
