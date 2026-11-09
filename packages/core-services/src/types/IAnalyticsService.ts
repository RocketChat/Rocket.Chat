import type { IServiceClass } from './ServiceClass.js';

export interface IAnalyticsService extends IServiceClass {
	saveSeatRequest(): Promise<void>;
	getSeatRequestCount(): Promise<number>;
	resetSeatRequestCount(): Promise<void>;
}
