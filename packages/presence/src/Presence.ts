import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { Users, UsersSessions } from '@rocket.chat/models';

import { processPresenceAndStatus } from './lib/processConnectionStatus';
import type { IPresence } from '../../../apps/meteor/server/sdk/types/IPresence';
import type { IBrokerNode } from '../../../apps/meteor/server/sdk/types/IBroker';
import { ServiceClass } from '../../../apps/meteor/server/sdk/types/ServiceClass';

export class Presence extends ServiceClass implements IPresence {
	protected name = 'presence';

	private broadcastEnabled = true;

	async onNodeDisconnected({ node }: { node: IBrokerNode }): Promise<void> {
		const affectedUsers = await this.removeLostConnections(node.id);
		return affectedUsers.forEach((uid) => this.updateUserPresence(uid));
	}

	async started(): Promise<void> {
		setTimeout(async () => {
			const affectedUsers = await this.removeLostConnections();
			return affectedUsers.forEach((uid) => this.updateUserPresence(uid));
		}, 100);

		// TODO show presence be reactive to database records or just websocket events?
		// if (isPresenceMonitorEnabled()) {
		// 	this.onEvent('watch.userSessions', async ({ clientAction, userSession }): Promise<void> => {
		// 		if (clientAction === 'removed') {
		// 			UserPresenceMonitor.processUserSession(
		// 				{
		// 					_id: userSession._id,
		// 					connections: [
		// 						{
		// 							fake: true,
		// 						},
		// 					],
		// 				},
		// 				'removed',
		// 			);
		// 		}

		// 		UserPresenceMonitor.processUserSession(userSession, minimongoChangeMap[clientAction]);
		// 	});
		// }
	}

	toggleBroadcast(enabled: boolean): void {
		this.broadcastEnabled = enabled;
	}

	async newConnection(
		uid: string | undefined,
		session: string | undefined,
		nodeId: string,
	): Promise<{ uid: string; connectionId: string } | undefined> {
		if (!uid || !session) {
			return;
		}
		// if (metadata) {
		// 	update.$set = {
		// 		metadata: metadata
		// 	};
		// 	connection.metadata = metadata;
		// }

		await UsersSessions.addConnectionById(uid, {
			id: session,
			instanceId: nodeId,
			status: UserStatus.ONLINE,
		});

		await this.updateUserPresence(uid);
		return {
			uid,
			connectionId: session,
		};
	}

	async removeConnection(uid: string | undefined, session: string | undefined): Promise<{ uid: string; session: string } | undefined> {
		if (!uid || !session) {
			return;
		}
		await UsersSessions.removeConnectionByConnectionId(session);

		await this.updateUserPresence(uid);

		return {
			uid,
			session,
		};
	}

	async removeLostConnections(nodeID?: string): Promise<string[]> {
		if (nodeID) {
			const affectedUsers = await UsersSessions.findByInstanceId(nodeID).toArray();

			const { modifiedCount } = await UsersSessions.removeConnectionsFromInstanceId(nodeID);

			if (modifiedCount === 0) {
				return [];
			}

			return affectedUsers.map(({ _id }) => {
				this.updateUserPresence(_id);
				return _id;
			});
		}

		// TODO  is this working?
		if (!this.context) {
			return [];
		}

		const nodes = await this.context.broker.nodeList();

		const ids = nodes.filter((node) => node.available).map(({ id }) => id);

		const affectedUsers = await UsersSessions.find(
			{
				'connections.instanceId': {
					$exists: true,
					$nin: ids,
				},
			},
			{ projection: { _id: 1 } },
		).toArray();

		const update = {
			$pull: {
				connections: {
					instanceId: {
						$nin: ids,
					},
				},
			},
		};
		const { modifiedCount } = await UsersSessions.updateMany({}, update);

		if (modifiedCount === 0) {
			return [];
		}

		return affectedUsers.map(({ _id }) => {
			this.updateUserPresence(_id);
			return _id;
		});
	}

	async setStatus(uid: string, statusDefault: UserStatus, statusText?: string): Promise<boolean> {
		const userSessions = (await UsersSessions.findOneById(uid)) || { connections: [] };

		const { status, statusConnection } = processPresenceAndStatus(userSessions.connections, statusDefault);

		const result = await Users.updateStatusById(uid, {
			statusDefault,
			status,
			statusConnection,
			statusText,
		});

		if (result.modifiedCount > 0) {
			const user = await Users.findOneById<Pick<IUser, 'username'>>(uid, { projection: { username: 1 } });
			this.broadcast({ _id: uid, username: user?.username, status, statusText });
		}

		return !!result.modifiedCount;
	}

	async setConnectionStatus(uid: string, status: UserStatus, session: string): Promise<boolean> {
		const result = await UsersSessions.updateConnectionStatusById(uid, session, status);

		await this.updateUserPresence(uid);

		return !!result.modifiedCount;
	}

	async updateUserPresence(uid: string): Promise<void> {
		const user = await Users.findOneById<Pick<IUser, 'username' | 'statusDefault' | 'statusText'>>(uid, {
			projection: {
				username: 1,
				statusDefault: 1,
				statusText: 1,
			},
		});
		if (!user) {
			return;
		}

		const userSessions = (await UsersSessions.findOneById(uid)) || { connections: [] };

		const { statusDefault } = user;

		const { status, statusConnection } = processPresenceAndStatus(userSessions.connections, statusDefault);

		const result = await Users.updateStatusById(uid, {
			status,
			statusConnection,
		});

		if (result.modifiedCount > 0) {
			this.broadcast({ _id: uid, username: user.username, status, statusText: user.statusText });
		}
	}

	private broadcast(user: { _id: string; username: string | undefined; status: UserStatus; statusText?: string }): void {
		if (!this.broadcastEnabled) {
			return;
		}
		this.api.broadcast('presence.status', {
			user,
		});
	}
}
