import { IServiceClass } from './ServiceClass';

export interface IUiKitCoreApp {
	appId: string;

	blockAction(payload: any): Promise<any>;
	viewClosed(payload: any): Promise<any>;
	viewSubmit(payload: any): Promise<any>;
}

interface IUiKitCoreService extends IServiceClass {
	blockAction(payload: any): Promise<any>;
	viewClosed(payload: any): Promise<any>;
	viewSubmit(payload: any): Promise<any>;
}

export interface IUiKitCoreAppService extends IUiKitCoreService {
	isRegistered(appId: string): Promise<boolean>;
}
