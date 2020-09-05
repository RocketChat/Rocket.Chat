import { USER_STATUS } from '../../../definition/UserStatus';

export interface IPresence {
	newConnection(uid: string, session: object): any;
	removeConnection(uid: string, session: object): Promise<any>;
	removeLostConnections(nodeID: string): Promise<string[]>;
	setStatus(uid: string, status: USER_STATUS, statusText?: string): Promise<boolean>;
	setConnectionStatus(uid: string, status: USER_STATUS, session: string): Promise<boolean>;
	updateUserPresence(uid: string): Promise<void>;
}
