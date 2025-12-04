import type { IUserSession } from '@rocket.chat/core-typings';
import type { IUsersSessionsModel } from '@rocket.chat/model-typings';

type ReaperPlan = {
	userId: string;
	removeIds: string[];
	shouldMarkOffline: boolean;
	cutoffDate: Date;
};

type ReaperCallback = (userIds: string[]) => void;

export class PresenceReaper {
	private usersSessions: IUsersSessionsModel;

	private staleThresholdMs: number;

	private batchSize: number;

	private running: boolean;

	private onUpdate: ReaperCallback;

	constructor(usersSessions: IUsersSessionsModel, onUpdate: ReaperCallback) {
		this.usersSessions = usersSessions;
		this.onUpdate = onUpdate;

		// Configuration: 5 minutes stale, process 500 users at a time
		this.staleThresholdMs = 5 * 60 * 1000;
		this.batchSize = 500;
		this.running = false;
	}

	public start() {
		if (this.running) return;
		this.running = true;

		// Run every 1 minute
		setInterval(() => {
			this.run().catch((err) => console.error('[PresenceReaper] Error:', err));
		}, 60 * 1000);

		console.log('[PresenceReaper] Service started.');
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

		// Step B: EMIT the event instead of calling a method directly
		if (usersToUpdate.length > 0) {
			this.onUpdate(usersToUpdate);
		}
	}
}
