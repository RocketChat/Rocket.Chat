import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';

export interface IAppsService {
	triggerEvent: (event: string, payload: Record<string, any>) => Promise<any>;
	updateAppsMarketplaceInfo: (apps: Array<IAppInfo>) => Promise<void>;
}
