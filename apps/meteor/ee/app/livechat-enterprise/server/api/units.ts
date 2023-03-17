import type { IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { API } from '../../../../../app/api/server';
import { findUnits, findUnitById, findUnitMonitors } from './lib/units';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';
import { findAllDepartmentsAvailable, findAllDepartmentsByUnit } from '../lib/Department';

API.v1.addRoute(
	'livechat/units/:unitId/monitors',
	{ authRequired: true, permissionsRequired: ['manage-livechat-monitors'] },
	{
		async get() {
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
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
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
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
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
			const { unitData, unitMonitors, unitDepartments } = this.bodyParams;
			return API.v1.success(LivechatEnterprise.saveUnit(null, unitData, unitMonitors, unitDepartments) as IOmnichannelBusinessUnit);
		},
	},
);

API.v1.addRoute(
	'livechat/units/:id',
	{ authRequired: true, permissionsRequired: ['manage-livechat-units'] },
	{
		async get() {
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
			const { id } = this.urlParams;
			const unit = await findUnitById({
				unitId: id,
			});

			return API.v1.success(unit);
		},
		async post() {
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
			const { unitData, unitMonitors, unitDepartments } = this.bodyParams;
			const { id } = this.urlParams;

			return API.v1.success(LivechatEnterprise.saveUnit(id, unitData, unitMonitors, unitDepartments) as IOmnichannelBusinessUnit);
		},
		async delete() {
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
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
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
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
			if (!(await Settings.findOne('Livechat_widget_enabled'))?.value) {
				return API.v1.failure('Livechat widget is disabled, please enable to use the endpoint.');
			}
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
