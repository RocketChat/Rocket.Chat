import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';

import type { IMarketplaceInfo } from '../../../src/server/marketplace';
import type { IAppStorageItem } from '../../../src/server/storage';
import { AppMetadataStorage } from '../../../src/server/storage';
import { AppInstallationSource } from '../../../src/server/storage/IAppStorageItem';

export class TestsAppStorage extends AppMetadataStorage {
	private db = new Map<string, IAppStorageItem>();

	constructor() {
		super('in-memory');
	}

	public create(item: IAppStorageItem): Promise<IAppStorageItem> {
		for (const [id, value] of this.db) {
			if (id === item.id || item.info.nameSlug === value.info.nameSlug) {
				return Promise.reject(new Error('App already exists.'));
			}
		}

		const stored = { ...item, _id: item._id ?? item.id, createdAt: new Date(), updatedAt: new Date() };
		this.db.set(stored.id, stored);
		return Promise.resolve(stored);
	}

	public retrieveOne(id: string): Promise<IAppStorageItem | null> {
		return Promise.resolve(this.db.get(id) ?? null);
	}

	public retrieveAll(): Promise<Map<string, IAppStorageItem>> {
		return Promise.resolve(new Map(this.db));
	}

	public retrieveAllPrivate(): Promise<Map<string, IAppStorageItem>> {
		const items = new Map<string, IAppStorageItem>();
		for (const [id, item] of this.db) {
			if (item.installationSource === AppInstallationSource.PRIVATE) {
				items.set(id, item);
			}
		}
		return Promise.resolve(items);
	}

	public clear(): void {
		this.db.clear();
	}

	public remove(id: string): Promise<{ success: boolean }> {
		this.db.delete(id);
		return Promise.resolve({ success: true });
	}

	public updatePartialAndReturnDocument(
		item: Partial<IAppStorageItem>,
		_options?: { unsetPermissionsGranted?: boolean },
	): Promise<IAppStorageItem> {
		const lookupId = item.id ?? item._id;
		if (!lookupId) {
			return Promise.reject(new Error('Cannot update: item has no id.'));
		}

		const existing = this.db.get(lookupId);
		if (!existing) {
			return Promise.reject(new Error(`App not found: ${lookupId}`));
		}

		const updated = { ...existing, ...item, updatedAt: new Date() };
		this.db.set(updated.id, updated);
		return Promise.resolve(updated);
	}

	public updateStatus(id: string, status: AppStatus): Promise<boolean> {
		const existing = this.db.get(id);
		if (!existing) {
			return Promise.resolve(false);
		}
		this.db.set(id, { ...existing, status, updatedAt: new Date() });
		return Promise.resolve(true);
	}

	public updateSetting(id: string, setting: ISetting): Promise<boolean> {
		const existing = this.db.get(id);
		if (!existing) {
			return Promise.resolve(false);
		}
		this.db.set(id, { ...existing, settings: { ...existing.settings, [setting.id]: setting }, updatedAt: new Date() });
		return Promise.resolve(true);
	}

	public updateAppInfo(id: string, info: IAppInfo): Promise<boolean> {
		const existing = this.db.get(id);
		if (!existing) {
			return Promise.resolve(false);
		}
		this.db.set(id, { ...existing, info, updatedAt: new Date() });
		return Promise.resolve(true);
	}

	public updateMarketplaceInfo(id: string, marketplaceInfo: IMarketplaceInfo[]): Promise<boolean> {
		const existing = this.db.get(id);
		if (!existing) {
			return Promise.resolve(false);
		}
		this.db.set(id, { ...existing, marketplaceInfo, updatedAt: new Date() });
		return Promise.resolve(true);
	}
}
