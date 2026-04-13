import { setInterval } from 'node:timers';

import type { IUserSession } from '@rocket.chat/core-typings';
import { UsersSessions } from '@rocket.chat/models';
import type { AnyBulkWriteOperation } from 'mongodb';

type ReaperPlan = {
	userId: string;
	removeIds: NonEmptyArray<string>;
	cutoffDate: Date;
};

type NonEmptyArray<T> = Omit<[T, ...T[]], 'map'> & {
	map<U>(callbackfn: (value: T, index: number, array: T[]) => U): NonEmptyArray<U>;
};

const isNonEmptyArray = <T>(arr: T[]): arr is NonEmptyArray<T> => arr.length > 0;

type ReaperCallback = (userIds: NonEmptyArray<string>) => Promise<void>;

type ReaperOptions = {
	onUpdate: ReaperCallback;
	staleThresholdMs: number;
	batchSize: number;
};

export class PresenceReaper {
	private staleThresholdMs: number;

	private batchSize: number;

	private running: boolean;

	private onUpdate: ReaperCallback;

	private intervalId?: NodeJS.Timeout;

	constructor(options: ReaperOptions) {
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
	}

	public stop() {
		if (!this.running) return;
		this.running = false;

		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = undefined;
		}
	}

	public async run(): Promise<void> {
		const cutoffDate = new Date(Date.now() - this.staleThresholdMs);

		// 1. Find users with potentially stale connections
		const cursor = UsersSessions.find(
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
	}

	private processDocument(sessionDoc: IUserSession, cutoffDate: Date, changeMap: Map<string, ReaperPlan>): void {
		const userId = sessionDoc._id;
		const allConnections = sessionDoc.connections || [];

		// Filter connections based on the cutoff
		const staleConnections = allConnections.filter((c) => c._updatedAt <= cutoffDate);

		if (isNonEmptyArray(staleConnections)) {
			changeMap.set(userId, {
				userId,
				removeIds: staleConnections.map((c) => c.id),
				cutoffDate, // Keep reference for race-condition check
			});
		}
	}

	private async flushBatch(changeMap: Map<string, ReaperPlan>): Promise<void> {
		const operations = [];

		for (const plan of changeMap.values()) {
			operations.push({
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
			} satisfies AnyBulkWriteOperation<IUserSession>);
		}

		if (isNonEmptyArray(operations)) {
			await UsersSessions.col.bulkWrite(operations);
			await this.onUpdate(operations.map((op) => op.updateOne.filter._id));
		}
	}
}
