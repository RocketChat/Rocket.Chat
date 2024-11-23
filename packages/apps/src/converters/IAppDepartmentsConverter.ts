import type { ILivechatDepartment } from '@rocket.chat/core-typings';

import type { IAppsDepartment } from '../AppsEngine';

export interface IAppDepartmentsConverter {
	convertById(departmentId: ILivechatDepartment['_id']): Promise<IAppsDepartment | undefined>;
	convertDepartment(department: undefined | null): Promise<undefined>;
	convertDepartment(department: ILivechatDepartment): Promise<IAppsDepartment>;
	convertDepartment(department: ILivechatDepartment | undefined | null): Promise<IAppsDepartment | undefined>;
	convertAppDepartment(department: undefined | null): undefined;
	convertAppDepartment(department: IAppsDepartment): ILivechatDepartment;
	convertAppDepartment(department: IAppsDepartment | undefined | null): ILivechatDepartment | undefined;
}
