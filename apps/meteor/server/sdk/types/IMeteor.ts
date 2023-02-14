import type { IRoutingManagerConfig } from '../../../definition/IRoutingManagerConfig';
import type { IServiceClass } from './ServiceClass';

export type AutoUpdateRecord = {
	_id: string;
	version: string;
	versionRefreshable?: string;
	versionNonRefreshable?: string;
	versionHmr: number;
	assets?: [
		{
			url: string;
		},
	];
};
export interface IMeteor extends IServiceClass {
	getAutoUpdateClientVersions(): Promise<Record<string, AutoUpdateRecord>>;
	getLoginServiceConfiguration(): Promise<any[]>;
	callMethodWithToken(userId: string | undefined, token: string | undefined, method: string, args: any[]): Promise<void | any>;
	notifyGuestStatusChanged(token: string, status: string): Promise<void>;
	getRoutingManagerConfig(): IRoutingManagerConfig;
}
