import type { IUser, UserStatus } from '@rocket.chat/core-typings';

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
	updateConnection(uid: string, connectionId: string): Promise<{ uid: string; connectionId: string } | undefined>;
	removeLostConnections(nodeID: string): Promise<string[]>;
	setStatus(userId: string, status: UserStatus, statusText?: string, statusExpiresAt?: Date): Promise<boolean>;
	setActiveState(
		userId: string,
		newState: Pick<IUser, 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt'>,
	): Promise<boolean>;
	endActiveState(userId: string): Promise<boolean>;
	clearActiveState(userId: string): Promise<boolean>;
	setConnectionStatus(uid: string, status: UserStatus, session: string): Promise<boolean>;
	toggleBroadcast(enabled: boolean): void;
	getConnectionCount(): { current: number; max: number };
	getPeakConnections(reset?: boolean): number;
	resetPeakConnections(): void;
}
