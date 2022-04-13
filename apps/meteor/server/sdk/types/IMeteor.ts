import { IServiceClass } from './ServiceClass';
import { IRoutingManagerConfig } from '../../../definition/IRoutingManagerConfig';

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
