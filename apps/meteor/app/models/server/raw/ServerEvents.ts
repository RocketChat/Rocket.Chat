import { IServerEvent, ServerEventType } from '@rocket.chat/core-typings';
import { Cursor } from 'mongodb';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class ServerEventsRaw extends BaseRaw<IServerEvent> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { t: 1, ip: 1, ts: -1 } }, { key: { 't': 1, 'u.username': 1, 'ts': -1 } }, { key: { indexKey: 1 } }];
	}

	async findLastFailedAttemptByIp(ip: string): Promise<IServerEvent | null> {
		return this.findOne<IServerEvent>(
			{
				ip,
				t: ServerEventType.FAILED_LOGIN_ATTEMPT,
			},
			{ sort: { ts: -1 } },
		);
	}

	async findLastFailedAttemptByUsername(username: string): Promise<IServerEvent | null> {
		return this.findOne<IServerEvent>(
			{
				'u.username': username,
				't': ServerEventType.FAILED_LOGIN_ATTEMPT,
			},
			{ sort: { ts: -1 } },
		);
	}

	async countFailedAttemptsByUsernameSince(username: string, since: Date): Promise<number> {
		return this.find({
			'u.username': username,
			't': ServerEventType.FAILED_LOGIN_ATTEMPT,
			'ts': {
				$gte: since,
			},
		}).count();
	}

	countFailedAttemptsByIpSince(ip: string, since: Date): Promise<number> {
		return this.find({
			ip,
			t: ServerEventType.FAILED_LOGIN_ATTEMPT,
			ts: {
				$gte: since,
			},
		}).count();
	}

	countFailedAttemptsByIp(ip: string): Promise<number> {
		return this.find({
			ip,
			t: ServerEventType.FAILED_LOGIN_ATTEMPT,
		}).count();
	}

	countFailedAttemptsByUsername(username: string): Promise<number> {
		return this.find({
			'u.username': username,
			't': ServerEventType.FAILED_LOGIN_ATTEMPT,
		}).count();
	}

	findSettingEventsByIndexHashIdBetweenDate(
		indexHash: string,
		from?: string,
		to?: string,
		pagination: { skip: number; limit: number } = { skip: 0, limit: 10 },
	): Cursor<IServerEvent> {
		const ts = {
			...(from && { $lte: new Date(from) }),
			...(to && { $gt: new Date(to) }),
		};

		return this.find(
			{
				t: ServerEventType.SETTING_MODIFIED,
				indexHash,
				...(Object.keys(ts).length > 0 && { ts }),
			},
			{ ...pagination },
		);
	}

	findSettingEventsAuditBetweenDates(
		from?: string,
		to?: string,
		pagination: { skip: number; limit: number } = { skip: 0, limit: 10 },
	): Cursor<IServerEvent> {
		const ts = {
			...(from && { $lte: new Date(from) }),
			...(to && { $gt: new Date(to) }),
		};

		return this.find(
			{
				t: ServerEventType.SETTING_MODIFIED,
				...(Object.keys(ts).length > 0 && { ts }),
			},
			{ ...pagination },
		);
	}
}
