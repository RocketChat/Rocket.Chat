import { setInterval } from 'node:timers';

import type { IUserSession } from '@rocket.chat/core-typings';
import type { IUsersSessionsModel } from '@rocket.chat/model-typings';

type ReaperPlan = {
	userId: string;
	removeIds: string[];
	shouldMarkOffline: boolean;
	cutoffDate: Date;
};

type NonEmptyArray<T> = [T, ...T[]];

const isNonEmptyArray = <T>(arr: T[]): arr is NonEmptyArray<T> => arr.length > 0;

type ReaperCallback = (userIds: NonEmptyArray<string>) => void;

type ReaperOptions = {
	usersSessions: IUsersSessionsModel;
	onUpdate: ReaperCallback;
	staleThresholdMs: number;
	batchSize: number;
};

export class PresenceReaper {
	private usersSessions: IUsersSessionsModel;

	private staleThresholdMs: number;

	private batchSize: number;

	private running: boolean;

	private onUpdate: ReaperCallback;

	private intervalId?: NodeJS.Timeout;

	constructor(options: ReaperOptions) {
		this.usersSessions = options.usersSessions;
		this.onUpdate = options.onUpdate;
		this.staleThresholdMs = options.staleThresholdMs;
		this.batchSize = options.batchSize;
		this.running = false;
	}

	public start() {
		if (this.running) return;
		this.running = true;

		// Run every 1 minute
		this.intervalId = setInterval(() => {
			this.run().catch((err) => console.error('[PresenceReaper] Error:', err));
		}, 60 * 1000);

		console.log('[PresenceReaper] Service started.');
	}

	public stop() {
		if (!this.running) return;
		this.running = false;

		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = undefined;
		}

		console.log('[PresenceReaper] Service stopped.');
	}

	public async run(): Promise<void> {
		console.log('[PresenceReaper] Running presence reaper job...');
		const cutoffDate = new Date(Date.now() - this.staleThresholdMs);

		// 1. Find users with potentially stale connections
		const cursor = this.usersSessions.find(
			{ 'connections._updatedAt': { $lte: cutoffDate } },
			{
				projection: { _id: 1, connections: 1 },
			},
		);

		const userChangeSet = new Map<string, ReaperPlan>();

		for await (const sessionDoc of cursor) {
			this.processDocument(sessionDoc, cutoffDate, userChangeSet);

			if (userChangeSet.size >= this.batchSize) {
				await this.flushBatch(userChangeSet);
				userChangeSet.clear();
			}
		}

		if (userChangeSet.size > 0) {
			await this.flushBatch(userChangeSet);
		}
		console.log('[PresenceReaper] Presence reaper job completed.');
	}

	private processDocument(sessionDoc: IUserSession, cutoffDate: Date, changeMap: Map<string, ReaperPlan>): void {
		const userId = sessionDoc._id;
		const allConnections = sessionDoc.connections || [];

		// Filter connections based on the cutoff
		const staleConnections = allConnections.filter((c) => c._updatedAt <= cutoffDate);
		const validConnections = allConnections.filter((c) => c._updatedAt > cutoffDate);

		if (staleConnections.length === 0) return;

		changeMap.set(userId, {
			userId,
			removeIds: staleConnections.map((c) => c.id),
			cutoffDate, // Keep reference for race-condition check
			shouldMarkOffline: validConnections.length === 0,
		});
	}

	private async flushBatch(changeMap: Map<string, ReaperPlan>): Promise<void> {
		const sessionOps = [];
		const usersToUpdate: string[] = [];

		for (const plan of changeMap.values()) {
			// 1. Prepare DB Cleanup
			if (plan.removeIds.length > 0) {
				sessionOps.push({
					updateOne: {
						filter: { _id: plan.userId },
						update: {
							$pull: {
								connections: {
									id: { $in: plan.removeIds },
									_updatedAt: { $lte: plan.cutoffDate },
								},
							},
						},
					},
				});
			}

			// 2. Identify potential offline users
			if (plan.shouldMarkOffline) {
				usersToUpdate.push(plan.userId);
			}
		}

		// Step A: Clean the Database
		if (sessionOps.length > 0) {
			await this.usersSessions.col.bulkWrite(sessionOps);
		}

		// Step B: Notify Presence Service
		if (isNonEmptyArray(usersToUpdate)) {
			this.onUpdate(usersToUpdate);
		}
	}
}
