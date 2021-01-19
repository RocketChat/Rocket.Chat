import { IServiceClass } from './ServiceClass';

export interface INPSCoreApp extends IServiceClass {
	blockAction(payload: any): Promise<any>;
}
