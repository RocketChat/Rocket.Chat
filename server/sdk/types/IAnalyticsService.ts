import { IServiceClass } from './ServiceClass';

export interface IAnalyticsService extends IServiceClass {
	saveSeatRequest(): Promise<void>;
	getSeatRequestCount(): Promise<number>;
	resetSeatRequestCount(): Promise<void>;
}
