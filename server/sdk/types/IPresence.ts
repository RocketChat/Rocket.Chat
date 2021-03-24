import { USER_STATUS } from '../../../definition/UserStatus';
import { IServiceClass } from './ServiceClass';

export interface IPresence extends IServiceClass {
	newConnection(uid: string, session: string): Promise<{uid: string; connectionId: string} | undefined>;
	removeConnection(uid: string, session: string): Promise<{uid: string; session: string}>;
	removeLostConnections(nodeID: string): Promise<string[]>;
	setStatus(uid: string, status: USER_STATUS, statusText?: string): Promise<boolean>;
	setConnectionStatus(uid: string, status: USER_STATUS, session: string): Promise<boolean>;
	updateUserPresence(uid: string): Promise<void>;
}
