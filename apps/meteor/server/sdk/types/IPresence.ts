import type { UserStatus } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface IPresence extends IServiceClass {
	newConnection(
		uid: string | undefined,
		session: string | undefined,
		nodeId: string,
	): Promise<{ uid: string; connectionId: string } | undefined>;
	removeConnection(
		uid: string | undefined,
		session: string | undefined,
		nodeId: string,
	): Promise<{ uid: string; session: string } | undefined>;
	removeLostConnections(nodeID: string): Promise<string[]>;
	setStatus(uid: string, status: UserStatus, statusText?: string): Promise<boolean>;
	setConnectionStatus(uid: string, status: UserStatus, session: string): Promise<boolean>;
	updateUserPresence(uid: string): Promise<void>;
	toggleBroadcast(enabled: boolean): void;
}
