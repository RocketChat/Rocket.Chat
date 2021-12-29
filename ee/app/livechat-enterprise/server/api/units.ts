import { API } from '../../../../../app/api/server';
import { deprecationWarning } from '../../../../../app/api/server/helpers/deprecationWarning';
import { findUnits, findUnitById, findUnitMonitors } from './lib/units';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

API.v1.addRoute(
	'livechat/units.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { text } = this.queryParams;

			const response = await findUnits({
				userId: this.userId,
				text,
				pagination: {
					offset,
					count,
					sort,
				},
			});

			return API.v1.success(deprecationWarning({ response, endpoint: 'livechat/units.list' }));
		},
	},
);

API.v1.addRoute(
	'livechat/units.getOne',
	{ authRequired: true },
	{
		async get() {
			const { unitId } = this.queryParams;

			if (!unitId) {
				return API.v1.failure('Missing "unitId" query parameter');
			}

			const unit = await findUnitById({
				userId: this.userId,
				unitId,
			});

			return API.v1.success(deprecationWarning({ response: unit, endpoint: 'livechat/units.getOne' }));
		},
	},
);

API.v1.addRoute(
	'livechat/unitMonitors.list',
	{ authRequired: true },
	{
		async get() {
			const { unitId } = this.queryParams;

			if (!unitId) {
				return API.v1.failure('The "unitId" parameter is required');
			}
			return API.v1.success({
				monitors: await findUnitMonitors({
					userId: this.userId,
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
					userId: this.userId,
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
			return LivechatEnterprise.saveUnit(null, unitData, unitMonitors, unitDepartments);
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
				userId: this.userId,
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
