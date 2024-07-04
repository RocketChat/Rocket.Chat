import type { ILivechatDepartment, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatUnit } from '@rocket.chat/models';

import { hasAnyRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';
import { callbacks } from '../../../../../lib/callbacks';
import { getUnitsFromUser } from '../methods/getUnitsFromUserRoles';

export const manageDepartmentUnit = async ({ userId, departmentId, unitId }: { userId: string; departmentId: string; unitId: string }) => {
	const accessibleUnits = await getUnitsFromUser(userId);
	const isLivechatManager = await hasAnyRoleAsync(userId, ['admin', 'livechat-manager']);
	const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'ancestors' | 'parentId'>>(departmentId, {
		projection: { ancestors: 1, parentId: 1 },
	});

	const isDepartmentAlreadyInUnit = unitId && department?.ancestors?.includes(unitId);
	if (!department || isDepartmentAlreadyInUnit) {
		return;
	}

	const currentDepartmentUnitId = department.parentId;
	const canManageNewUnit = !unitId || isLivechatManager || (Array.isArray(accessibleUnits) && accessibleUnits.includes(unitId));
	const canManageCurrentUnit =
		!currentDepartmentUnitId || isLivechatManager || (Array.isArray(accessibleUnits) && accessibleUnits.includes(currentDepartmentUnitId));
	if (!canManageNewUnit || !canManageCurrentUnit) {
		return;
	}

	if (unitId) {
		const unit = await LivechatUnit.findOneById<Pick<IOmnichannelBusinessUnit, '_id' | 'ancestors'>>(unitId, {
			projection: { ancestors: 1 },
		});

		if (!unit) {
			return;
		}

		if (currentDepartmentUnitId) {
			await LivechatUnit.decrementDepartmentsCount(currentDepartmentUnitId);
		}

		await LivechatDepartment.addDepartmentToUnit(departmentId, unitId, [unitId, ...(unit.ancestors || [])]);
		await LivechatUnit.incrementDepartmentsCount(unitId);
		return;
	}

	if (currentDepartmentUnitId) {
		await LivechatUnit.decrementDepartmentsCount(currentDepartmentUnitId);
	}

	await LivechatDepartment.removeDepartmentFromUnit(departmentId);
};

callbacks.add('livechat.manageDepartmentUnit', manageDepartmentUnit, callbacks.priority.HIGH, 'livechat-manage-department-unit');
