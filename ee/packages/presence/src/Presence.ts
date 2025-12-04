import type { IPresence, IBrokerNode } from '@rocket.chat/core-services';
import { License, ServiceClass } from '@rocket.chat/core-services';
import type { IUser, IUserSession } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { Settings, Users, UsersSessions } from '@rocket.chat/models';
import type { AnyBulkWriteOperation } from 'mongodb';

import { UPDATE_INTERVAL, STALE_THRESHOLD, MAX_CONNECTIONS } from './lib/constants';
import { processPresenceAndStatus } from './lib/processConnectionStatus';

export class Presence extends ServiceClass implements IPresence {
	protected name = 'presence';

	private broadcastEnabled = true;

	private hasPresenceLicense = false;

	private hasScalabilityLicense = false;

	private hasLicense = false;

	private lostConTimeout?: NodeJS.Timeout;

	private staleConInterval?: NodeJS.Timeout;

	private connsPerInstance = new Map<string, number>();

	private peakConnections = 0;

	private lastUpdate = new Map<string, number>();

	shouldUpdateConnectionStatus(session: string): boolean {
		const lastUpdated = this.lastUpdate.get(session);
		if (!lastUpdated) {
			this.lastUpdate.set(session, Date.now());
			return true;
		}
		if (Date.now() - lastUpdated > UPDATE_INTERVAL) {
			this.lastUpdate.set(session, Date.now());
			return true;
		}
		return false;
	}

	constructor() {
		super();

		this.onEvent('watch.instanceStatus', async ({ clientAction, id, diff }): Promise<void> => {
			if (clientAction === 'removed') {
				this.connsPerInstance.delete(id);

				const affectedUsers = await this.removeLostConnections(id);
				affectedUsers.forEach((uid) => this.updateUserPresence(uid));
				return;
			}

			// always store the number of connections per instance so we can show correct in the UI
			if (diff?.hasOwnProperty('extraInformation.conns')) {
				this.connsPerInstance.set(id, diff['extraInformation.conns']);

				this.peakConnections = Math.max(this.peakConnections, this.getTotalConnections());
				this.validateAvailability();
			}
		});

		this.onEvent('license.module', async ({ module, valid }) => {
			switch (module) {
				case 'unlimited-presence':
					this.hasPresenceLicense = valid;
					break;
				case 'scalability':
					this.hasScalabilityLicense = valid;
					break;
				default:
					return;
			}

			// The scalability module is also accepted as a way to enable the presence service for backwards compatibility
			this.hasLicense = this.hasPresenceLicense || this.hasScalabilityLicense;
			// broadcast should always be enabled if license is active (unless the troubleshoot setting is on)
			if (!this.broadcastEnabled && this.hasLicense) {
				await this.toggleBroadcast(true);
			}
		});
	}

	async onNodeDisconnected({ node }: { node: IBrokerNode }): Promise<void> {
		const affectedUsers = await this.removeLostConnections(node.id);
		return affectedUsers.forEach((uid) => this.updateUserPresence(uid));
	}

	async started(): Promise<void> {
		this.lostConTimeout = setTimeout(async () => {
			const affectedUsers = await this.removeLostConnections();
			return affectedUsers.forEach((uid) => this.updateUserPresence(uid));
		}, 10000);

		this.staleConInterval = setInterval(async () => {
			const affectedUsers = await this.removeStaleConnections();
			return affectedUsers.forEach((uid) => this.updateUserPresence(uid));
		}, UPDATE_INTERVAL);

		try {
			await Settings.updateValueById('Presence_broadcast_disabled', false);

			this.hasScalabilityLicense = await License.hasModule('scalability');
			this.hasPresenceLicense = await License.hasModule('unlimited-presence');
			this.hasLicense = this.hasPresenceLicense || this.hasScalabilityLicense;
		} catch (e: unknown) {
			// ignore
		}
	}

	async stopped(): Promise<void> {
		clearTimeout(this.lostConTimeout);
		clearInterval(this.staleConInterval);
	}

	async toggleBroadcast(enabled: boolean): Promise<void> {
		if (!this.hasLicense && this.getTotalConnections() > MAX_CONNECTIONS) {
			throw new Error('Cannot enable broadcast when there are more than 200 connections');
		}
		this.broadcastEnabled = enabled;

		// update the setting only to turn it on, because it may have been disabled via the troubleshooting setting, which doesn't affect the setting
		if (enabled) {
			await Settings.updateValueById('Presence_broadcast_disabled', false);
		}
	}

	getConnectionCount(): { current: number; max: number } {
		return {
			current: this.getTotalConnections(),
			max: MAX_CONNECTIONS,
		};
	}

	async newConnection(
		uid: string | undefined,
		session: string | undefined,
		nodeId: string,
	): Promise<{ uid: string; connectionId: string } | undefined> {
		if (!uid || !session) {
			return;
		}

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

	async updateConnection(uid: string, session: string): Promise<{ uid: string; session: string } | undefined> {
		if (!this.shouldUpdateConnectionStatus(session)) {
			return;
		}
		console.debug(`Updating connection for user ${uid} and session ${session}`);
		const result = await UsersSessions.updateConnectionById(uid, session);
		if (result.modifiedCount === 0) {
			return;
		}

		await this.updateUserPresence(uid);

		return { uid, session };
	}

	/**
	 * Runs the cleanup job to remove stale connections and sync user status.
	 */
	async removeStaleConnections() {
		console.debug('[Cleanup] Starting stale connections cleanup job.');
		const cutoffDate = new Date(Date.now() - STALE_THRESHOLD);

		// STEP 1: Find users who have AT LEAST one stale connection
		// We project the whole connections array because we need to inspect it in memory
		const cursor = UsersSessions.find({ 'connections._updatedAt': { $lte: cutoffDate } }, { projection: { _id: 1, connections: 1 } });

		const bulkSessionOps: AnyBulkWriteOperation<IUserSession>[] = [];
		const bulkUserOps: AnyBulkWriteOperation<IUser>[] = [];
		const processedUserIds = [];

		// STEP 2: Iterate and Calculate
		for await (const sessionDoc of cursor) {
			const userId = sessionDoc._id;
			const allConnections = sessionDoc.connections || [];

			// Separate valid vs stale based on the cutoff
			const staleConnections = allConnections.filter((c) => c._updatedAt <= cutoffDate);
			const validConnections = allConnections.filter((c) => c._updatedAt > cutoffDate);

			if (staleConnections.length === 0) continue; // Should not happen due to query, but safe to check

			// Collect the IDs of the connections we want to remove
			const staleConnectionIds = staleConnections.map((c) => c.id);

			// OPERATION A: Remove specific connections from usersSessions
			// We use the unique IDs to be surgically precise
			bulkSessionOps.push({
				updateOne: {
					filter: { _id: userId },
					update: {
						$pull: {
							connections: { id: { $in: staleConnectionIds } },
						},
					},
				},
			});

			// OPERATION B: Update user status if they will have NO connections left
			if (validConnections.length === 0) {
				bulkUserOps.push({
					updateOne: {
						filter: { _id: userId },
						update: { $set: { status: UserStatus.OFFLINE } },
					},
				});
				processedUserIds.push(userId);
			}
		}

		// STEP 3: Execute the operations
		if (bulkSessionOps.length > 0) {
			await UsersSessions.col.bulkWrite(bulkSessionOps);
			console.log(`[Cleanup] Removed stale connections for ${bulkSessionOps.length} users.`);
		}

		if (bulkUserOps.length > 0) {
			await Users.col.bulkWrite(bulkUserOps);
			console.log(`[Cleanup] Marked ${bulkUserOps.length} users as OFFLINE.`);
		}

		console.debug(`[Cleanup] Finished stale connections cleanup job.`);

		return processedUserIds;
	}

	async removeConnection(uid: string | undefined, session: string | undefined): Promise<{ uid: string; session: string } | undefined> {
		if (uid === 'rocketchat.internal.admin.test') {
			console.log('Admin detected, skipping removal of connection for testing purposes.');
			return;
		}
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

			return affectedUsers.map(({ _id }) => _id);
		}

		const nodes = (await this.api?.nodeList()) || [];

		const ids = nodes.filter((node) => node.available).map(({ id }) => id);
		if (ids.length === 0) {
			return [];
		}

		const affectedUsers = await UsersSessions.findByOtherInstanceIds(ids, { projection: { _id: 1 } }).toArray();

		const { modifiedCount } = await UsersSessions.removeConnectionsFromOtherInstanceIds(ids);
		if (modifiedCount === 0) {
			return [];
		}

		return affectedUsers.map(({ _id }) => _id);
	}

	async setStatus(uid: string, statusDefault: UserStatus, statusText?: string): Promise<boolean> {
		const userSessions = (await UsersSessions.findOneById(uid)) || { connections: [] };

		const user = await Users.findOneById<Pick<IUser, 'username' | 'roles' | 'status'>>(uid, {
			projection: { username: 1, roles: 1, status: 1 },
		});

		const { status, statusConnection } = processPresenceAndStatus(userSessions.connections, statusDefault);

		const result = await Users.updateStatusById(uid, {
			statusDefault,
			status,
			statusConnection,
			statusText,
		});

		if (result.modifiedCount > 0) {
			this.broadcast({ _id: uid, username: user?.username, status, statusText, roles: user?.roles || [] }, user?.status);
		}

		return !!result.modifiedCount;
	}

	async setConnectionStatus(uid: string, status: UserStatus, session: string): Promise<boolean> {
		const result = await UsersSessions.updateConnectionStatusById(uid, session, status);

		await this.updateUserPresence(uid);

		return !!result.modifiedCount;
	}

	async updateUserPresence(uid: string): Promise<void> {
		const user = await Users.findOneById<Pick<IUser, 'username' | 'statusDefault' | 'statusText' | 'roles' | 'status'>>(uid, {
			projection: {
				username: 1,
				statusDefault: 1,
				statusText: 1,
				roles: 1,
				status: 1,
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
			this.broadcast({ _id: uid, username: user.username, status, statusText: user.statusText, roles: user.roles }, user.status);
		}
	}

	private broadcast(
		user: Pick<IUser, '_id' | 'username' | 'status' | 'statusText' | 'roles'>,
		previousStatus: UserStatus | undefined,
	): void {
		if (!this.broadcastEnabled) {
			return;
		}
		this.api?.broadcast('presence.status', {
			user,
			previousStatus,
		});
	}

	private async validateAvailability(): Promise<void> {
		if (this.hasLicense) {
			return;
		}

		if (this.getTotalConnections() > MAX_CONNECTIONS) {
			this.broadcastEnabled = false;

			await Settings.updateValueById('Presence_broadcast_disabled', true);
		}
	}

	private getTotalConnections(): number {
		return Array.from(this.connsPerInstance.values()).reduce((acc, conns) => acc + conns, 0);
	}

	getPeakConnections(reset = false): number {
		const peak = this.peakConnections;
		if (reset) {
			this.resetPeakConnections();
		}
		return peak;
	}

	resetPeakConnections(): void {
		this.peakConnections = 0;
	}
}
