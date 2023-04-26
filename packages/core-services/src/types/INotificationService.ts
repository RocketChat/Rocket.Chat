import type { IServiceClass } from './ServiceClass';

export interface INotificationService extends IServiceClass {
	notifyRoom(room: string, eventName: string, ...args: any[]): void;
}
