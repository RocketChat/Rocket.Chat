import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';
import type { IAppLogStorageFindOptions } from '@rocket.chat/apps-engine/server/storage';
import { AppLogStorage } from '@rocket.chat/apps-engine/server/storage';
import { InstanceStatus } from '@rocket.chat/instance-status';
import type { AppLogs } from '@rocket.chat/models';
import fastRedact, { type redactFnNoSerialize } from 'fast-redact';

export class AppRealLogStorage extends AppLogStorage {
	private readonly redact: redactFnNoSerialize;

	constructor(private db: typeof AppLogs) {
		super('mongodb');

		this.redact = fastRedact({
			paths: [
				'headers.cookie',
				'headers["x-auth-token"]',
				'headers.authorization',
				'headers.access_token',
				'query["x-auth-token"]',
				'query.authorization',
				'query.access_token',
				'query.customFields.*',
				'params["x-auth-token"]',
				'params.authorization',
				'params.access_token',
				'params.customFields.*',
				'user.customFields.*',
				'user.emails[*].address',
			],
			serialize: false,
			strict: false,
		});
	}

	async find(
		query: {
			[field: string]: any;
		},
		options: IAppLogStorageFindOptions,
	) {
		return this.db.find<ILoggerStorageEntry>(query, options).toArray();
	}

	async findPaginated(
		query: {
			[field: string]: any;
		},
		options: IAppLogStorageFindOptions,
	) {
		const { cursor, totalCount } = this.db.findPaginated<ILoggerStorageEntry>(query, options);

		const [logs, total] = await Promise.all([cursor.toArray(), totalCount]);

		return {
			logs,
			total,
		};
	}

	async distinctValues(appId: string) {
		return this.db.getDistinctFieldsForFilters(appId);
	}

	async storeEntries(logEntry: ILoggerStorageEntry): Promise<ILoggerStorageEntry> {
		logEntry.instanceId = InstanceStatus.id();

		logEntry.entries.forEach((entry) => {
			entry.args.forEach((arg) => void (typeof arg === 'object' && arg !== null ? this.redact(arg) : arg));
		});

		const id = (await this.db.insertOne(logEntry)).insertedId;

		return this.db.findOneById(id);
	}

	async getEntriesFor(appId: string): Promise<ILoggerStorageEntry[]> {
		return this.db.find({ appId }).toArray();
	}

	async removeEntriesFor(appId: string): Promise<void> {
		await this.db.deleteOne({ appId });
	}
}
