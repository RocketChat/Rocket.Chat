import { IServiceClass } from './ServiceClass';
import { IRoutingManagerConfig } from '../../../definition/IRoutingManagerConfig';

export type AutoUpdateRecord = {
	_id: string;
	version: string;
	versionRefreshable?: string;
	versionNonRefreshable?: string;
	assets?: [{
		url: string;
	}];
}

export interface IMeteor extends IServiceClass {
	getLastAutoUpdateClientVersions(): Promise<AutoUpdateRecord[]>;

	getLoginServiceConfiguration(): Promise<any[]>;

	callMethodWithToken(userId: string | undefined, token: string | undefined, method: string, args: any[]): Promise<void | any>;

	notifyGuestStatusChanged(token: string, status: string): Promise<void>;

	getRoutingManagerConfig(): IRoutingManagerConfig;
}
