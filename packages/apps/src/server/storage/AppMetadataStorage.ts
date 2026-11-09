import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus.js';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata/IAppInfo.js';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings/index.js';

import type { IAppStorageItem } from './IAppStorageItem.js';
import type { IMarketplaceInfo } from '../marketplace/index.js';

export abstract class AppMetadataStorage {
	constructor(private readonly engine: string) {}

	public getEngine() {
		return this.engine;
	}

	public abstract create(item: IAppStorageItem): Promise<IAppStorageItem>;

	public abstract retrieveOne(id: string): Promise<IAppStorageItem | null>;

	public abstract retrieveAll(): Promise<Map<string, IAppStorageItem>>;

	public abstract retrieveAllPrivate(): Promise<Map<string, IAppStorageItem>>;

	public abstract remove(id: string): Promise<{ success: boolean }>;

	public abstract updatePartialAndReturnDocument(
		item: Partial<IAppStorageItem>,
		options?: { unsetPermissionsGranted?: boolean },
	): Promise<IAppStorageItem>;

	public abstract updateStatus(_id: string, status: AppStatus): Promise<boolean>;

	public abstract updateSetting(_id: string, setting: ISetting): Promise<boolean>;

	public abstract updateAppInfo(_id: string, info: IAppInfo): Promise<boolean>;

	public abstract updateMarketplaceInfo(_id: string, marketplaceInfo: IMarketplaceInfo[]): Promise<boolean>;
}
