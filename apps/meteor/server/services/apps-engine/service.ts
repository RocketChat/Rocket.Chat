import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IAppsEngineService } from '@rocket.chat/core-services';
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { ISetting } from '@rocket.chat/core-typings';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { IGetAppsFilter } from '@rocket.chat/apps-engine/server/IGetAppsFilter';

import { Apps, AppEvents } from '../../../ee/server/apps/orchestrator';
import { SystemLogger } from '../../lib/logger/system';

export class AppsEngineService extends ServiceClassInternal implements IAppsEngineService {
	protected name = 'apps-engine';

	constructor() {
		super();

		this.onEvent('presence.status', async ({ user, previousStatus }): Promise<void> => {
			await Apps.triggerEvent(AppEvents.IPostUserStatusChanged, {
				user,
				currentStatus: user.status,
				previousStatus,
			});
		});

		this.onEvent('apps.added', async (appId: string): Promise<void> => {
			// if the app already exists in this instance, don't load it again
			const app = Apps.getManager()?.getOneById(appId);

			if (app) {
				return;
			}

			await (Apps.getManager() as any)?.loadOne(appId);
		});

		this.onEvent('apps.removed', async (appId: string): Promise<void> => {
			const app = Apps.getManager()?.getOneById(appId);
			if (!app) {
				return;
			}

			await Apps.getManager()?.removeLocal(appId);
		});

		this.onEvent('apps.updated', async (appId: string): Promise<void> => {
			const storageItem = await Apps.getStorage()?.retrieveOne(appId);
			if (!storageItem) {
				return;
			}

			const appPackage = await Apps.getAppSourceStorage()?.fetch(storageItem);
			if (!appPackage) {
				return;
			}

			await Apps.getManager()?.updateLocal(storageItem, appPackage);
		});

		this.onEvent('apps.statusUpdate', async (appId: string, status: AppStatus): Promise<void> => {
			const app = Apps.getManager()?.getOneById(appId);
			if (!app || app.getStatus() === status) {
				return;
			}

			if (AppStatusUtils.isEnabled(status)) {
				await Apps.getManager()?.enable(appId).catch(SystemLogger.error);
			} else if (AppStatusUtils.isDisabled(status)) {
				await Apps.getManager()?.disable(appId, status, true).catch(SystemLogger.error);
			}
		});

		this.onEvent('apps.settingUpdated', async (appId: string, setting: ISetting & { id: string }): Promise<void> => {
			const app = Apps.getManager()?.getOneById(appId);
			const oldSetting = app?.getStorageItem().settings[setting.id].value;

			// avoid updating the setting if the value is the same,
			// which caused an infinite loop
			if (oldSetting === setting.value) {
				return;
			}

			const appManager = Apps.getManager();
			if (!appManager) {
				return;
			}

			await appManager.getSettingsManager().updateAppSetting(appId, setting as any);
		});
	}

	isInitialized(): boolean {
		return Apps.isInitialized();
	}

	async getApps(query: IGetAppsFilter): Promise<IAppInfo[] | undefined> {
		return Apps.getManager()
			?.get(query)
			.map((app) => app.getApp().getInfo());
	}

	async getAppStorageItemById(appId: string): Promise<IAppStorageItem | undefined> {
		const app = Apps.getManager()?.getOneById(appId);

		if (!app) {
			return;
		}

		return app.getStorageItem();
	}
}
