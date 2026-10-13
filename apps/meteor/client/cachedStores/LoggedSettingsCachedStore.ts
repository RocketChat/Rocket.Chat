import type { ISetting, Serialized } from '@rocket.chat/core-typings';

import { sdk } from '../lib/SDKClient';
import { PrivateCachedStore } from '../lib/cachedStores/CachedStore';
import { getUserId } from '../lib/user';
import { LoggedSettings } from '../stores';

type LoggedSettingRecord = Serialized<ISetting> | { _id: ISetting['_id']; _deletedAt: string };

class LoggedSettingsCachedStore extends PrivateCachedStore<ISetting, LoggedSettingRecord> {
	private cacheKey: string | undefined;

	private licenseSubscription: { stop: () => void } | undefined;

	constructor() {
		super({
			name: 'logged-settings',
			eventType: 'notify-logged',
			store: LoggedSettings.use,
		});
	}

	protected override async callLoad() {
		const { update, cacheKey } = await sdk.rest.get('/v1/settings.loggedIn', {});
		this.cacheKey = cacheKey;
		return update;
	}

	protected override async callSync(updatedSince: Date) {
		if (!getUserId()) {
			return { update: [], remove: [] };
		}

		const { update, remove, cacheKey, reset } = await sdk.rest.get('/v1/settings.loggedIn', {
			updatedSince: updatedSince.toISOString(),
			...(this.cacheKey && { cacheKey: this.cacheKey }),
		});
		this.cacheKey = cacheKey;
		return { update, remove, reset };
	}

	protected override getCacheMetadata() {
		return { cacheKey: this.cacheKey };
	}

	protected override restoreCacheMetadata(metadata: Record<string, unknown>) {
		this.cacheKey = typeof metadata.cacheKey === 'string' ? metadata.cacheKey : undefined;
	}

	protected override mapRecord(record: LoggedSettingRecord): ISetting {
		return {
			...super.mapRecord(record),
			...('_updatedAt' in record && typeof record._updatedAt === 'string' && { _updatedAt: new Date(record._updatedAt) }),
			...('_deletedAt' in record && typeof record._deletedAt === 'string' && { _deletedAt: new Date(record._deletedAt) }),
		};
	}

	protected override setupListener() {
		this.licenseSubscription?.stop();
		this.licenseSubscription = sdk.stream('notify-all', ['license'], () => this.trySync());
		return super.setupListener();
	}

	override async release() {
		await super.release();
		this.licenseSubscription?.stop();
		this.licenseSubscription = undefined;
	}

	override clearCacheOnLogout() {
		this.cacheKey = undefined;
		super.clearCacheOnLogout();
	}
}

const instance = new LoggedSettingsCachedStore();

export { instance as LoggedSettingsCachedStore };
