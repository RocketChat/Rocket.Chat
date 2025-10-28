import type { IRole } from '@rocket.chat/core-typings';

import type { IAppsRole } from '../AppsEngine';

export interface IAppRolesConverter {
	convertById(roleId: IRole['_id']): Promise<IAppsRole | undefined>;
	convertRole(role: IRole): Promise<IAppsRole>;
}
