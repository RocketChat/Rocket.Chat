import { BaseRaw } from './BaseRaw';

export class LivechatDepartmentRaw extends BaseRaw {
	findInIds(departmentsIds, options) {
		const query = { _id: { $in: departmentsIds } };
		return this.find(query, options);
	}
}
