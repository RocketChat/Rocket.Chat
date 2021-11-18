import { API } from '../../../../../app/api/server';
import { findUnits, findUnitById, findUnitMonitors } from './lib/units';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

API.v1.addRoute('livechat/units.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();
		const { text } = this.queryParams;

		return API.v1.success(this.deprecationWarning(Promise.await(findUnits({
			userId: this.userId,
			text,
			pagination: {
				offset,
				count,
				sort,
			},
		}))));
	},
});

API.v1.addRoute('livechat/units.getOne', { authRequired: true }, {
	get() {
		const { unitId } = this.queryParams;

		return API.v1.success(this.deprecationWarning(Promise.await(findUnitById({
			userId: this.userId,
			unitId,
		}))));
	},
});

API.v1.addRoute('livechat/unitMonitors.list', { authRequired: true }, {
	get() {
		const { unitId } = this.queryParams;

		return API.v1.success(Promise.await(findUnitMonitors({
			userId: this.userId,
			unitId,
		})));
	},
});

API.v1.addRoute('livechat/units', { authRequired: true, permissionsRequired: ['manage-livechat-units'] }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();
		const { text } = this.queryParams;

		return API.v1.success(Promise.await(findUnits({
			userId: this.userId,
			text,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
	post() {
		const { unitData, unitMonitors, unitDepartments } = this.requestParams();
		return LivechatEnterprise.saveUnit(null, unitData, unitMonitors, unitDepartments);
	},
});

API.v1.addRoute('livechat/units/:id', { authRequired: true, permissionsRequired: ['manage-livechat-units'] }, {
	get() {
		const { id } = this.urlParams;

		return API.v1.success(Promise.await(findUnitById({
			userId: this.userId,
			id,
		})));
	},
	put() {
		const { unitData, unitMonitors, unitDepartments } = this.requestParams();
		const { id } = this.urlParams;

		return LivechatEnterprise.saveUnit(id, unitData, unitMonitors, unitDepartments);
	},
	delete() {
		const { id } = this.urlParams;

		return LivechatEnterprise.removeUnit(id);
	},
});
