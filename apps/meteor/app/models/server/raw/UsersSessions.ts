import type { IUserSession, IUserSessionConnection } from '@rocket.chat/core-typings';
import type { Cursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class UsersSessionsRaw extends BaseRaw<IUserSession> {
	clearConnectionsFromInstanceId(instanceId: string[]): ReturnType<BaseRaw<IUserSession>['updateMany']> {
		return this.col.updateMany(
			{},
			{
				$pull: {
					connections: {
						instanceId: {
							$nin: instanceId,
						},
					},
				},
			},
		);
	}

	updateConnectionStatusById(uid: string, connectionId: string, status: string): ReturnType<BaseRaw<IUserSession>['updateOne']> {
		const query = {
			'_id': uid,
			'connections.id': connectionId,
		};

		const update = {
			$set: {
				'connections.$.status': status,
				'connections.$._updatedAt': new Date(),
			},
		};

		return this.updateOne(query, update);
	}

	async removeConnectionsFromInstanceId(instanceId: string): ReturnType<BaseRaw<IUserSession>['updateMany']> {
		return this.updateMany(
			{
				'connections.instanceId': instanceId,
			},
			{
				$pull: {
					connections: {
						instanceId,
					},
				},
			},
		);
	}

	async removeConnectionByConnectionId(connectionId: string): ReturnType<BaseRaw<IUserSession>['updateMany']> {
		return this.updateMany(
			{
				'connections.id': connectionId,
			},
			{
				$pull: {
					connections: {
						id: connectionId,
					},
				},
			},
		);
	}

	findByInstanceId(instanceId: string): Cursor<IUserSession> {
		return this.find({
			'connections.instanceId': instanceId,
		});
	}

	addConnectionById(
		userId: string,
		{ id, instanceId, status }: Pick<IUserSessionConnection, 'id' | 'instanceId' | 'status'>,
	): ReturnType<BaseRaw<IUserSession>['updateOne']> {
		const now = new Date();

		const update = {
			$push: {
				connections: {
					id,
					instanceId,
					status,
					_createdAt: now,
					_updatedAt: now,
				},
			},
		};

		return this.updateOne({ _id: userId }, update, { upsert: true });
	}
}
