import { Collection, ObjectId } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IServerEvent, IServerEventType } from '../../../../definition/IServerEvent';
import { IUser } from '../../../../definition/IUser';

export class ServerEventsRaw extends BaseRaw {
	public readonly col!: Collection<IServerEvent>;

	async insertOne(data: Omit<IServerEvent, '_id'>): Promise<any> {
		if (data.u) {
			data.u = { _id: data.u._id, username: data.u.username } as IUser;
		}
		return this.col.insertOne({
			_id: new ObjectId().toHexString(),
			...data,
		});
	}

	async findLastFailedAttemptByIp(ip: string): Promise<IServerEvent | null> {
		return this.col.findOne({
			ip,
			t: IServerEventType.FAILED_LOGIN_ATTEMPT,
		}, { sort: { ts: -1 } });
	}

	async findLastFailedAttemptByUsername(username: string): Promise<IServerEvent | null> {
		return this.col.findOne({
			'u.username': username,
			t: IServerEventType.FAILED_LOGIN_ATTEMPT,
		}, { sort: { ts: -1 } });
	}

	async countFailedAttemptsByUsernameSince(username: string, since: Date): Promise<number> {
		return this.col.find({
			'u.username': username,
			t: IServerEventType.FAILED_LOGIN_ATTEMPT,
			ts: {
				$gte: since,
			},
		}).count();
	}

	countFailedAttemptsByIpSince(ip: string, since: Date): Promise<number> {
		return this.col.find({
			ip,
			t: IServerEventType.FAILED_LOGIN_ATTEMPT,
			ts: {
				$gte: since,
			},
		}).count();
	}

	countFailedAttemptsByIp(ip: string): Promise<number> {
		return this.col.find({
			ip,
			t: IServerEventType.FAILED_LOGIN_ATTEMPT,
		}).count();
	}

	countFailedAttemptsByUsername(username: string): Promise<number> {
		return this.col.find({
			'u.username': username,
			t: IServerEventType.FAILED_LOGIN_ATTEMPT,
		}).count();
	}
}
