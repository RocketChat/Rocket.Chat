import type { IUserSession, IUserSessionConnection, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IUsersSessionsModel } from '@rocket.chat/model-typings';
import type { FindCursor, Collection, Db, FindOptions } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class UsersSessionsRaw extends BaseRaw<IUserSession> implements IUsersSessionsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IUserSession>>) {
		super(db, 'usersSessions', trash, {
			preventSetUpdatedAt: true,
			collectionNameResolver(name) {
				return name;
			},
		});
	}

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

	removeConnectionsFromOtherInstanceIds(instanceIds: string[]): ReturnType<BaseRaw<IUserSession>['updateMany']> {
		return this.updateMany(
			{},
			{
				$pull: {
					connections: {
						instanceId: {
							$nin: instanceIds,
						},
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

	findByInstanceId(instanceId: string): FindCursor<IUserSession> {
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

	findByOtherInstanceIds(instanceIds: string[], options?: FindOptions<IUserSession>): FindCursor<IUserSession> {
		return this.find(
			{
				'connections.instanceId': {
					$exists: true,
					$nin: instanceIds,
				},
			},
			options,
		);
	}
}
