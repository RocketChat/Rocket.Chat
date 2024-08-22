import type { ILivechatUnitMonitor, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

import { API } from '../../../../../app/api/server';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import { findAllDepartmentsAvailable, findAllDepartmentsByUnit } from '../lib/Department';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';
import { findUnits, findUnitById, findUnitMonitors } from './lib/units';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/livechat/units/:unitId/monitors': {
			GET: (params: { unitId: string }) => { monitors: ILivechatUnitMonitor[] };
		};
		'/v1/livechat/units': {
			GET: (params: { text: string }) => PaginatedResult & { units: IOmnichannelBusinessUnit[] };
			POST: (params: { unitData: string; unitMonitors: string; unitDepartments: string }) => Omit<IOmnichannelBusinessUnit, '_updatedAt'>;
		};
		'/v1/livechat/units/:id': {
			GET: () => IOmnichannelBusinessUnit;
			POST: (params: { unitData: string; unitMonitors: string; unitDepartments: string }) => Omit<IOmnichannelBusinessUnit, '_updatedAt'>;
			DELETE: () => number;
		};
	}
}

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
			const params = this.queryParams;
			const { offset, count } = await getPaginationItems(params);
			const { sort } = await this.parseJsonQuery();
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
			return API.v1.success(await LivechatEnterprise.saveUnit(null, unitData, unitMonitors, unitDepartments));
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

			return API.v1.success(await LivechatEnterprise.saveUnit(id, unitData, unitMonitors, unitDepartments));
		},
		async delete() {
			const { id } = this.urlParams;

			return API.v1.success((await LivechatEnterprise.removeUnit(id)).deletedCount);
		},
	},
);

API.v1.addRoute(
	'livechat/units/:unitId/departments',
	{ authRequired: true, permissionsRequired: ['manage-livechat-units'] },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
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
			const { offset, count } = await getPaginationItems(this.queryParams);
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
