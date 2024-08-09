import type { AppManager } from '@rocket.chat/apps-engine/server/AppManager';

import { API } from '../../../../../app/api/server';
import type { AppsRestApi } from '../rest';

export const appsInfoHandler = (apiManager: AppsRestApi) =>
	[
		{
			authRequired: true,
		},
		{
			async get(): Promise<any> {
				const manager = apiManager._manager as AppManager;

				const appsGetter = await manager.get();

				const apps = appsGetter.map((app) => {
					const appInfo = app.getInfo();
					return appInfo;
				});

				return API.v1.success(apps);
			},
		},
	] as const;
