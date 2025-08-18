import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { applyDepartmentRestrictions } from '@rocket.chat/omni-core';
import type { FilterOperators } from 'mongodb';

import { addQueryRestrictionsToDepartmentsModel } from '../units/getUnitsFromUser';
import { hooksLogger } from '../utils/logger';

export const applyDepartmentRestrictionsPatch = () => {
	applyDepartmentRestrictions.patch(async (_prev, query: FilterOperators<ILivechatDepartment> = {}, userId: string) => {
		hooksLogger.debug('Applying department query restrictions');
		return addQueryRestrictionsToDepartmentsModel(query, userId);
	});
};
