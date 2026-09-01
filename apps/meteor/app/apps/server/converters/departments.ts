import type { IAppDepartmentsConverter, IAppServerOrchestrator, IAppsDepartment } from '@rocket.chat/apps';
import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';
import * as z from 'zod';

import { DepartmentCodec } from './codecs';

export class AppDepartmentsConverter implements IAppDepartmentsConverter {
	constructor(protected readonly orch: IAppServerOrchestrator) {
		this.orch = orch;
	}

	async convertById(id: ILivechatDepartment['_id']): Promise<IAppsDepartment | undefined> {
		const department = await LivechatDepartment.findOneById(id);

		return this.convertDepartment(department);
	}

	async convertDepartment(department: undefined | null): Promise<undefined>;

	async convertDepartment(department: ILivechatDepartment): Promise<IAppsDepartment>;

	async convertDepartment(department: ILivechatDepartment | undefined | null): Promise<IAppsDepartment | undefined>;

	async convertDepartment(department: ILivechatDepartment | undefined | null): Promise<IAppsDepartment | undefined> {
		if (!department) {
			return undefined;
		}

		return z.decode(DepartmentCodec, department);
	}

	convertAppDepartment(department: undefined | null): undefined;

	convertAppDepartment(department: IAppsDepartment): ILivechatDepartment;

	convertAppDepartment(department: IAppsDepartment | undefined | null): ILivechatDepartment | undefined;

	convertAppDepartment(department: IAppsDepartment | undefined | null): ILivechatDepartment | undefined {
		if (!department) {
			return undefined;
		}

		return z.encode(DepartmentCodec, department);
	}
}
