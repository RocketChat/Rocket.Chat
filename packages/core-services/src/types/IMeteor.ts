import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';

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
	getLoginServiceConfiguration(): Promise<LoginServiceConfiguration[]>;
	callMethodWithToken(
		userId: string | undefined,
		token: string | undefined,
		method: string,
		args: any[],
	): Promise<{
		result: unknown;
	}>;
	notifyGuestStatusChanged(token: string, status: string): Promise<void>;
	getURL(path: string, params?: Record<string, any>, cloudDeepLinkUrl?: string): Promise<string>;
}
