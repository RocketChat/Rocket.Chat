import type { IPresence, IBrokerNode } from '@rocket.chat/core-services';
import { License, ServiceClass, Settings } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { Users, UsersSessions } from '@rocket.chat/models';

import { PresenceReaper } from './lib/PresenceReaper';
import { type ClaimUpdate, processPresence } from './lib/presenceEngine';

const MAX_CONNECTIONS = 200;

export class Presence extends ServiceClass implements IPresence {
	protected name = 'presence';

	private broadcastEnabled = true;

	private hasPresenceLicense = false;

	private hasScalabilityLicense = false;

	private hasLicense = false;

	private lostConTimeout?: NodeJS.Timeout;

	private connsPerInstance = new Map<string, number>();

	private peakConnections = 0;

	private reaper: PresenceReaper;

	constructor() {
		super();

		this.reaper = new PresenceReaper({
			batchSize: 500,
			staleThresholdMs: 5 * 60 * 1000, // 5 minutes
			onUpdate: (userIds) => this.handleReaperUpdates(userIds),
		});

		this.onEvent('watch.instanceStatus', async ({ clientAction, id, diff }): Promise<void> => {
			if (clientAction === 'removed') {
				this.connsPerInstance.delete(id);

				const affectedUsers = await this.removeLostConnections(id);
				affectedUsers.forEach((uid) => this.updateUserPresence(uid));
				return;
			}

			// always store the number of connections per instance so we can show correct in the UI
			if (diff && Object.hasOwn(diff, 'extraInformation.conns')) {
				this.connsPerInstance.set(id, diff['extraInformation.conns']);

				this.peakConnections = Math.max(this.peakConnections, this.getTotalConnections());
				void this.validateAvailability();
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

	override async started(): Promise<void> {
		this.reaper.start();
		this.lostConTimeout = setTimeout(async () => {
			const affectedUsers = await this.removeLostConnections();
			return affectedUsers.forEach((uid) => this.updateUserPresence(uid));
		}, 10000);

		try {
			await Settings.set('Presence_broadcast_disabled', false);

			this.hasScalabilityLicense = await License.hasModule('scalability');
			this.hasPresenceLicense = await License.hasModule('unlimited-presence');
			this.hasLicense = this.hasPresenceLicense || this.hasScalabilityLicense;
		} catch (e: unknown) {
			// ignore
		}

		// TODO: Agenda default lockLifetime is 10 min. This job executes in ms and runs every 1 min.
		// If an instance crashes mid-execution, expired statuses stay locked for up to 10 min.
		// Reduce lockLifetime to 60s once @rocket.chat/agenda exposes the option in its typed API.
		await cronJobs.add('presence-status-expiration', '* * * * *', () => this.processExpiredStatuses());
	}

	private async processExpiredStatuses(batchSize = 100): Promise<void> {
		const expiredUsers = await Users.findExpiredStatuses(batchSize).toArray();

		if (expiredUsers.length === 0) {
			return;
		}

		const results = await Promise.allSettled(expiredUsers.map(({ _id }) => this.endActiveState(_id)));
		const successful = results.filter((result) => result.status === 'fulfilled').length;

		if (expiredUsers.length === batchSize && successful > 0) {
			return this.processExpiredStatuses();
		}
	}

	private async handleReaperUpdates(userIds: string[]): Promise<void> {
		const results = await Promise.allSettled(userIds.map((uid) => this.updateUserPresence(uid)));
		const fulfilled = results.filter((result) => result.status === 'fulfilled');
		const rejected = results.filter((result) => result.status === 'rejected');

		if (fulfilled.length > 0) {
			console.debug(`[PresenceReaper] Successfully updated presence for ${fulfilled.length} users.`);
		}

		if (rejected.length > 0) {
			console.error(
				`[PresenceReaper] Failed to update presence for ${rejected.length} users:`,
				rejected.map(({ reason }) => reason),
			);
		}
	}

	override async stopped(): Promise<void> {
		this.reaper.stop();
		if (!this.lostConTimeout) {
			return;
		}
		clearTimeout(this.lostConTimeout);
	}

	async toggleBroadcast(enabled: boolean): Promise<void> {
		if (!this.hasLicense && this.getTotalConnections() > MAX_CONNECTIONS) {
			throw new Error('Cannot enable broadcast when there are more than 200 connections');
		}
		this.broadcastEnabled = enabled;

		// update the setting only to turn it on, because it may have been disabled via the troubleshooting setting, which doesn't affect the setting
		if (enabled) {
			await Settings.set('Presence_broadcast_disabled', false);
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

	async updateConnection(uid: string, connectionId: string): Promise<{ uid: string; connectionId: string } | undefined> {
		const query = {
			'_id': uid,
			'connections.id': connectionId,
		};

		const update = {
			$set: {
				'connections.$._updatedAt': new Date(),
			},
		};

		const result = await UsersSessions.updateOne(query, update);
		if (result.modifiedCount === 0) {
			return;
		}

		await this.updateUserPresence(uid);

		return { uid, connectionId };
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

	/**
	 * @deprecated Use setActiveState, endActiveState, or clearActiveState instead.
	 */
	async setStatus(userId: string, statusDefault: UserStatus, statusText?: string): Promise<boolean> {
		if (statusDefault === UserStatus.ONLINE && !statusText) {
			return this.updateUserPresence(userId, { type: 'clearActive' });
		}

		return this.updateUserPresence(userId, {
			type: 'setActive',
			newState: {
				statusDefault,
				statusSource: 'manual',
				...(statusText != null && { statusText }),
			},
		});
	}

	/**
	 * Applies a presence claim from a source (manual, external, internal).
	 */
	async setActiveState(
		userId: string,
		newState: Pick<IUser, 'statusDefault' | 'statusSource' | 'statusText' | 'statusExpiresAt'>,
	): Promise<void> {
		await this.updateUserPresence(userId, { type: 'setActive', newState });
	}

	/**
	 * Ends the current active claim. Restores previous if valid, otherwise
	 * falls back to system-managed.
	 */
	async endActiveState(userId: string): Promise<void> {
		await this.updateUserPresence(userId, { type: 'endActive' });
	}

	/**
	 * Removes all presence claims and resets to "Online" with no text.
	 */
	async clearActiveState(userId: string): Promise<void> {
		await this.updateUserPresence(userId, { type: 'clearActive' });
	}

	async setConnectionStatus(uid: string, status: UserStatus, session: string): Promise<boolean> {
		const result = await UsersSessions.updateConnectionStatusById(uid, session, status);

		await this.updateUserPresence(uid);

		return !!result.modifiedCount;
	}

	private async updateUserPresence(uid: string, claimUpdate?: ClaimUpdate): Promise<boolean> {
		const user = await Users.findOneById<
			Pick<
				IUser,
				| '_id'
				| 'username'
				| 'roles'
				| 'status'
				| 'statusDefault'
				| 'statusSource'
				| 'statusText'
				| 'statusExpiresAt'
				| 'statusConnection'
				| 'previousState'
			>
		>(uid, {
			projection: {
				username: 1,
				roles: 1,
				status: 1,
				statusDefault: 1,
				statusSource: 1,
				statusText: 1,
				statusExpiresAt: 1,
				statusConnection: 1,
				previousState: 1,
			},
		});
		if (!user) {
			return false;
		}

		const userSessions = await UsersSessions.findOneById(uid);
		const sessions = userSessions?.connections ?? [];

		const result = processPresence(user, sessions, claimUpdate);
		if (Object.keys(result.values).length === 0) {
			return false;
		}

		const updatedUser = await Users.updatePresenceAndStatus(uid, result.values, result.clear);
		if (updatedUser) {
			this.broadcast(updatedUser, user.status);
		}
		return !!updatedUser;
	}

	private broadcast(
		user: Pick<IUser, '_id' | 'username' | 'status' | 'statusText' | 'roles'>,
		previousStatus: UserStatus | undefined,
	): void {
		if (!this.broadcastEnabled) {
			return;
		}
		void this.api?.broadcast('presence.status', {
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

			await Settings.set('Presence_broadcast_disabled', true);
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
