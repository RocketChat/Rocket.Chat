import type { IServiceClass } from './ServiceClass';

export interface IUiKitCoreApp {
	appId: string;

	blockAction?(payload: any): Promise<any>;
	viewClosed?(payload: any): Promise<any>;
	viewSubmit?(payload: any): Promise<any>;
}

export interface IUiKitCoreAppService extends IServiceClass {
	isRegistered(appId: string): Promise<boolean>;
	blockAction(payload: any): Promise<any>;
	viewClosed(payload: any): Promise<any>;
	viewSubmit(payload: any): Promise<any>;
}
