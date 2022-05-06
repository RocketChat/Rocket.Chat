import { UserStatus } from '@rocket.chat/core-typings';

import { IServiceClass } from './ServiceClass';

export interface IPresence extends IServiceClass {
	newConnection(uid: string, session: string): Promise<{ uid: string; connectionId: string } | undefined>;
	removeConnection(uid: string, session: string): Promise<{ uid: string; session: string }>;
	removeLostConnections(nodeID: string): Promise<string[]>;
	setStatus(uid: string, status: UserStatus, statusText?: string): Promise<boolean>;
	setConnectionStatus(uid: string, status: UserStatus, session: string): Promise<boolean>;
	updateUserPresence(uid: string): Promise<void>;
}
