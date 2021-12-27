import { escapeRegExp } from '@rocket.chat/string-helpers';

import { callbacks } from '../../../../../app/callbacks/server';
import {
	LivechatDepartment,
} from '../../../../../app/models/server/raw';
import { ILivechatDepartment } from '../../../../../definition/ILivechatDepartment';

type FindAllResult = Promise<{ departments: ILivechatDepartment[]; total: number }>

export const findAllDepartmentsAvailable = async (uid: string, unitId: string, offset: number, count: number, text: string, onlyMyDepartments = false): FindAllResult => {
	const filterReg = new RegExp(escapeRegExp(text), 'i');

	let query = {
		type: { $ne: 'u' },
		$or: [{ ancestors: { $in: [[unitId], null, []] } }, { ancestors: { $exists: false } }],
		...text && { name: filterReg },

	};

	if (onlyMyDepartments) {
		query = callbacks.run('livechat.applyDepartmentRestrictions', query, { userId: uid });
	}

	const cursor = LivechatDepartment.find(query, { limit: count, skip: offset });

	const departments = await cursor.toArray();
	const total = await cursor.count();

	return { departments, total };
};

export const findAllDepartmentsByUnit = async (unitId: string, offset: number, count: number): FindAllResult => {
	const cursor = LivechatDepartment.find({
		ancestors: { $in: [unitId] },
	}, { limit: count, skip: offset });

	const total = await cursor.count();
	const departments = await cursor.toArray();

	return { departments, total };
};
