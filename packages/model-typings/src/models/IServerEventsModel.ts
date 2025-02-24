import type { ExtractDataToParams, IAuditServerActor, IServerEvent, IServerEvents } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IServerEventsModel extends IBaseModel<IServerEvent> {
	findLastFailedAttemptByIp(ip: string): Promise<IServerEvent | null>;
	findLastFailedAttemptByUsername(username: string): Promise<IServerEvent | null>;
	findLastSuccessfulAttemptByIp(ip: string): Promise<IServerEvent | null>;
	findLastSuccessfulAttemptByUsername(username: string): Promise<IServerEvent | null>;
	countFailedAttemptsByUsernameSince(username: string, since: Date): Promise<number>;
	countFailedAttemptsByIpSince(ip: string, since: Date): Promise<number>;
	countFailedAttemptsByIp(ip: string): Promise<number>;
	countFailedAttemptsByUsername(username: string): Promise<number>;
	createAuditServerEvent<K extends keyof IServerEvents, E extends IServerEvents[K]>(
		key: K,
		data: ExtractDataToParams<E>,
		actor: IAuditServerActor,
	): Promise<void>;
}
