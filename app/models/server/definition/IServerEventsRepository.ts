import { IServerEvent } from '../../../../definition/IServerEvent';

export interface IServerEventsRepository {
	insertOne(data: Omit<IServerEvent, '_id'>): Promise<any>;
	countFailedAttemptsByUsername(username: string): Promise<number>;
	countFailedAttemptsByUsernameSince(username: string, since: Date): Promise<number>;
	countFailedAttemptsByIpSince(ip: string, since: Date): Promise<number>;
	countFailedAttemptsByIp(ip: string): Promise<number>;
	findLastFailedAttemptByUsername(username: string): Promise<IServerEvent>;
	findLastFailedAttemptByIp(ip: string): Promise<IServerEvent>;
}
