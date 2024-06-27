import type { ILivechatDepartment, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatUnit } from '@rocket.chat/models';

import { hasAnyRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';
import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';
import { getUnitsFromUser } from '../methods/getUnitsFromUserRoles';

callbacks.add(
	'livechat.manageDepartmentUnit',
	async ({ userId, departmentId, unitId }) => {
		const units = await getUnitsFromUser(userId);
		const isLivechatManager = await hasAnyRoleAsync(userId, ['admin', 'livechat-manager']);
		const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'ancestors' | 'parentId'>>(departmentId, {
			projection: { ancestors: 1, parentId: 1 },
		});

		if (!department || (unitId && department.ancestors?.includes(unitId))) {
			return;
		}

		const currentDepartmentUnitId = department.parentId;
		const canManageNewUnit = !unitId || isLivechatManager || (Array.isArray(units) && units.includes(unitId));
		const canManageCurrentUnit =
			!currentDepartmentUnitId || isLivechatManager || (Array.isArray(units) && units.includes(currentDepartmentUnitId));
		if (!canManageNewUnit || !canManageCurrentUnit) {
			return;
		}

		if (currentDepartmentUnitId) {
			await LivechatUnit.decrementDepartmentsCount(currentDepartmentUnitId);
		}

		if (unitId) {
			const unit = await LivechatUnit.findOneById<Pick<IOmnichannelBusinessUnit, '_id' | 'ancestors'>>(unitId, {
				projection: { ancestors: 1 },
			});

			if (!unit) {
				return;
			}

			await LivechatDepartment.addDepartmentToUnit(departmentId, unitId, [unitId, ...(unit.ancestors || [])]);
			await LivechatUnit.incrementDepartmentsCount(unitId);
			return;
		}

		await LivechatDepartment.removeDepartmentFromUnit(departmentId);
	},
	callbacks.priority.HIGH,
	'livechat-manage-department-unit',
);
