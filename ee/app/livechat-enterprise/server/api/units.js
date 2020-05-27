import { API } from '../../../../../server/api';
import { findUnits, findUnitById, findUnitMonitors } from './lib/units';

API.v1.addRoute('livechat/units.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findUnits({
			userId: this.userId,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('livechat/units.getOne', { authRequired: true }, {
	get() {
		const { unitId } = this.queryParams;

		return API.v1.success(Promise.await(findUnitById({
			userId: this.userId,
			unitId,
		})));
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
