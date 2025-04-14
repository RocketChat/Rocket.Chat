import { Apps, AppEvents } from '@rocket.chat/apps';
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { IGetAppsFilter } from '@rocket.chat/apps-engine/server/IGetAppsFilter';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import type { AppStatusReport, IAppsEngineService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';

import { isRunningMs } from '../../lib/isRunningMs';
import { SystemLogger } from '../../lib/logger/system';

export class AppsEngineService extends ServiceClassInternal implements IAppsEngineService {
	protected name = 'apps-engine';

	constructor() {
		super();

		this.onEvent('presence.status', async ({ user, previousStatus }): Promise<void> => {
			await Apps.self?.triggerEvent(AppEvents.IPostUserStatusChanged, {
				user,
				currentStatus: user.status,
				previousStatus,
			});
		});

		this.onEvent('apps.added', async (appId: string): Promise<void> => {
			Apps.self?.getRocketChatLogger().debug(`"apps.added" event received for app "${appId}"`);
			// if the app already exists in this instance, don't load it again
			const app = Apps.self?.getManager()?.getOneById(appId);

			if (app) {
				Apps.self?.getRocketChatLogger().info(`"apps.added" event received for app "${appId}", but it already exists in this instance`);
				return;
			}

			await Apps.self?.getManager()?.addLocal(appId);
		});

		this.onEvent('apps.removed', async (appId: string): Promise<void> => {
			Apps.self?.getRocketChatLogger().debug(`"apps.removed" event received for app "${appId}"`);
			const app = Apps.self?.getManager()?.getOneById(appId);
			if (!app) {
				Apps.self
					?.getRocketChatLogger()
					.info(`"apps.removed" event received for app "${appId}", but it couldn't be found in this instance`);
				return;
			}

			await Apps.self?.getManager()?.removeLocal(appId);
		});

		this.onEvent('apps.updated', async (appId: string): Promise<void> => {
			Apps.self?.getRocketChatLogger().debug(`"apps.updated" event received for app "${appId}"`);
			const storageItem = await Apps.self?.getStorage()?.retrieveOne(appId);
			if (!storageItem) {
				Apps.self?.getRocketChatLogger().info(`"apps.updated" event received for app "${appId}", but it couldn't be found in the storage`);
				return;
			}

			const appPackage = await Apps.self?.getAppSourceStorage()?.fetch(storageItem);
			if (!appPackage) {
				return;
			}

			const isEnabled = AppStatusUtils.isEnabled(storageItem.status);
			if (isEnabled) {
				await Apps.self?.getManager()?.updateAndStartupLocal(storageItem, appPackage);
			} else {
				await Apps.self?.getManager()?.updateAndInitializeLocal(storageItem, appPackage);
			}
		});

		this.onEvent('apps.statusUpdate', async (appId: string, status: AppStatus): Promise<void> => {
			Apps.self?.getRocketChatLogger().debug(`"apps.statusUpdate" event received for app "${appId}" with status "${status}"`);
			const app = Apps.self?.getManager()?.getOneById(appId);
			if (!app) {
				Apps.self
					?.getRocketChatLogger()
					.info(`"apps.statusUpdate" event received for app "${appId}", but it couldn't be found in this instance`);
				return;
			}

			if ((await app.getStatus()) === status) {
				Apps.self?.getRocketChatLogger().info(`"apps.statusUpdate" event received for app "${appId}", but the status is the same`);
				return;
			}

			if (AppStatusUtils.isEnabled(status)) {
				await Apps.self?.getManager()?.enable(appId).catch(SystemLogger.error);
			} else if (AppStatusUtils.isDisabled(status)) {
				await Apps.self?.getManager()?.disable(appId, status, true).catch(SystemLogger.error);
			}
		});

		this.onEvent('apps.settingUpdated', async (appId: string, setting): Promise<void> => {
			Apps.self?.getRocketChatLogger().debug(`"apps.settingUpdated" event received for app "${appId}"`, { setting });
			const app = Apps.self?.getManager()?.getOneById(appId);
			const oldSetting = app?.getStorageItem().settings[setting.id].value;

			// avoid updating the setting if the value is the same,
			// which caused an infinite loop
			// and sometimes the settings can be an array
			// so we need to convert it to JSON stringified to compare it

			if (JSON.stringify(oldSetting) === JSON.stringify(setting.value)) {
				Apps.self
					?.getRocketChatLogger()
					.info(`"apps.settingUpdated" event received for setting ${setting.id} of app "${appId}", but the setting value is the same`);
				return;
			}

			await Apps.self
				?.getManager()
				?.getSettingsManager()
				.updateAppSetting(appId, setting as any);
		});
	}

	isInitialized(): boolean {
		return Boolean(Apps.self?.isInitialized());
	}

	async getApps(query: IGetAppsFilter): Promise<IAppInfo[] | undefined> {
		return (await Apps.self?.getManager()?.get(query))?.map((app) => app.getInfo());
	}

	async getAppsStatusLocal(): Promise<AppStatusReport[]> {
		const apps = await Apps.self?.getManager()?.get();

		if (!apps) {
			return [];
		}

		return Promise.all(
			apps.map(async (app) => ({
				status: await app.getStatus(),
				appId: app.getID(),
				createdAt: app.getStorageItem().createdAt,
				updatedAt: app.getStorageItem().updatedAt,
			})),
		);
	}

	async getAppStorageItemById(appId: string): Promise<IAppStorageItem | undefined> {
		const app = Apps.self?.getManager()?.getOneById(appId);

		if (!app) {
			return;
		}

		return app.getStorageItem();
	}

	async getAppsStatusInCluster(): Promise<Record<string, AppStatusReport[]>> {
		if (!isRunningMs()) {
			throw new Error('Getting apps status in cluster is only available in microservices mode');
		}

		const services: { name: string; nodes: string[] }[] = await this.api?.call('$node.services', { onlyActive: true });
		const nodes = services?.find((service) => service.name === 'apps-engine')?.nodes;

		if (!nodes || nodes.length < 2) {
			throw new Error('Not enough Apps-Engine nodes in deployment');
		}

		const apps: Promise<{ nodeID: string; appsStatus: AppStatusReport[] }>[] = nodes.map(async (nodeID) => {
			const appsStatus: AppStatusReport[] | undefined = await this.api?.call('apps-engine.getAppsStatusLocal', [], { nodeID });

			if (!appsStatus) {
				throw new Error(`Failed to get apps status from node ${nodeID}`);
			}

			return {
				nodeID,
				appsStatus,
			};
		});

		const resolvedApps = await Promise.all(apps);

		return resolvedApps.reduce(
			(acc, { nodeID, appsStatus }) => {
				acc[nodeID] = appsStatus;
				return acc;
			},
			{} as Record<string, AppStatusReport[]>,
		);
	}
}
