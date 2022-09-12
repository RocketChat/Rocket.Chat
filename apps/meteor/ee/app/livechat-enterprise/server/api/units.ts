import { API } from '../../../../../app/api/server';
import { findUnits, findUnitById, findUnitMonitors } from './lib/units';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';
import { findAllDepartmentsAvailable, findAllDepartmentsByUnit } from '../lib/Department';

API.v1.addRoute(
	'livechat/units/:unitId/monitors',
	{ authRequired: true, permissionsRequired: ['manage-livechat-monitors'] },
	{
		async get() {
			const { unitId } = this.urlParams;

			if (!unitId) {
				return API.v1.failure('The "unitId" parameter is required');
			}
			return API.v1.success({
				monitors: await findUnitMonitors({
					unitId,
				}),
			});
		},
	},
);

API.v1.addRoute(
	'livechat/units',
	{ authRequired: true, permissionsRequired: ['manage-livechat-units'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { text } = this.queryParams;

			return API.v1.success(
				await findUnits({
					text,
					pagination: {
						offset,
						count,
						sort,
					},
				}),
			);
		},
		async post() {
			const { unitData, unitMonitors, unitDepartments } = this.bodyParams;
			return API.v1.success(LivechatEnterprise.saveUnit(null, unitData, unitMonitors, unitDepartments));
		},
	},
);

API.v1.addRoute(
	'livechat/units/:id',
	{ authRequired: true, permissionsRequired: ['manage-livechat-units'] },
	{
		async get() {
			const { id } = this.urlParams;
			const unit = await findUnitById({
				unitId: id,
			});

			return API.v1.success(unit);
		},
		async post() {
			const { unitData, unitMonitors, unitDepartments } = this.bodyParams;
			const { id } = this.urlParams;

			return LivechatEnterprise.saveUnit(id, unitData, unitMonitors, unitDepartments);
		},
		async delete() {
			const { id } = this.urlParams;

			return LivechatEnterprise.removeUnit(id);
		},
	},
);

API.v1.addRoute(
	'livechat/units/:unitId/departments',
	{ authRequired: true, permissionsRequired: ['manage-livechat-units'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { unitId } = this.urlParams;

			const { departments, total } = await findAllDepartmentsByUnit(unitId, offset, count);

			return API.v1.success({
				departments,
				count: departments.length,
				offset,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'livechat/units/:unitId/departments/available',
	{ authRequired: true, permissionsRequired: ['manage-livechat-units'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { unitId } = this.urlParams;
			const { text, onlyMyDepartments } = this.queryParams;

			const { departments, total } = await findAllDepartmentsAvailable(
				this.userId,
				unitId,
				offset,
				count,
				text,
				onlyMyDepartments === 'true',
			);

			return API.v1.success({
				departments,
				count: departments.length,
				offset,
				total,
			});
		},
	},
);
