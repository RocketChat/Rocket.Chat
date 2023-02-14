import type { ILivechatDepartmentModel } from '@rocket.chat/model-typings';

import { LivechatDepartmentRaw } from '../../../../server/models/raw/LivechatDepartment';

declare module '@rocket.chat/model-typings' {
	export interface ILivechatDepartmentModel {
		removeDepartmentFromForwardListById(departmentId: string): Promise<void>;
	}
}

export class LivechatDepartmentEE extends LivechatDepartmentRaw implements ILivechatDepartmentModel {
	async removeDepartmentFromForwardListById(departmentId: string): Promise<void> {
		await this.updateMany({ departmentsAllowedToForward: departmentId }, { $pull: { departmentsAllowedToForward: departmentId } });
	}
}
