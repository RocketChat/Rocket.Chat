import { ServiceClass } from './ServiceClass';

export interface IBroker {
	createService(service: ServiceClass): void;
	call(method: string, data: any): Promise<any>;
}
