import { AppEvents, getOrchestrator } from '@rocket.chat/apps';
import type {
	AppStatusReport,
	IAppsEngine,
	IAppsOutboundProviders,
	IAppsVideoConfProviders,
	IAppServerOrchestrator,
} from '@rocket.chat/apps';
import type { IGetAppsFilter } from '@rocket.chat/apps/dist/server/IGetAppsFilter';
import type { AppOutboundCommunicationProviderManager } from '@rocket.chat/apps/dist/server/managers/AppOutboundCommunicationProviderManager';
import type { AppVideoConfProviderManager } from '@rocket.chat/apps/dist/server/managers/AppVideoConfProviderManager';
import type { IAppStorageItem } from '@rocket.chat/apps/dist/server/storage/IAppStorageItem';
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import { InstanceStatus } from '@rocket.chat/instance-status';

import { isRunningMs } from '../../lib/isRunningMs';
import { SystemLogger } from '../../lib/logger/system';

export class AppsEngineNoNodesFoundError extends Error {
	constructor(message = 'Not enough Apps-Engine nodes in deployment') {
		super(message);
	}
}

export class AppsEngineService extends ServiceClassInternal implements IAppsEngine {
	protected name = 'apps-engine';

	/**
	 * Direct reference to the in-process orchestrator, populated once the
	 * orchestrator registers itself via `registerOrchestrator`. This service is the
	 * facade backing for `Apps` — it is the only consumer of the orchestrator
	 * outside the Apps implementation directories.
	 */
	private get orch(): IAppServerOrchestrator | undefined {
		return getOrchestrator();
	}

	constructor() {
		super();

		this.onEvent('presence.status', async ({ user, previousStatus }): Promise<void> => {
			await this.orch?.triggerEvent(AppEvents.IPostUserStatusChanged, {
				user,
				currentStatus: user.status,
				previousStatus,
			});
		});

		this.onEvent('apps.added', async (appId: string): Promise<void> => {
			this.orch?.getRocketChatLogger().debug({
				msg: '"apps.added" event received for app',
				appId,
			});
			// if the app already exists in this instance, don't load it again
			const app = this.orch?.getManager()?.getOneById(appId);

			if (app) {
				this.orch?.getRocketChatLogger().info({
					msg: '"apps.added" event received for app, but it already exists in this instance',
					appId,
				});
				return;
			}

			await this.orch?.getManager()?.addLocal(appId);
		});

		this.onEvent('apps.removed', async (appId: string): Promise<void> => {
			this.orch?.getRocketChatLogger().debug({
				msg: '"apps.removed" event received for app',
				appId,
			});
			const app = this.orch?.getManager()?.getOneById(appId);
			if (!app) {
				this.orch?.getRocketChatLogger().info({
					msg: '"apps.removed" event received for app, but it could not be found in this instance',
					appId,
				});
				return;
			}

			await this.orch?.getManager()?.removeLocal(appId);
		});

		this.onEvent('apps.updated', async (appId: string, originInstanceId?: string): Promise<void> => {
			this.orch?.getRocketChatLogger().debug({
				msg: '"apps.updated" event received for app',
				appId,
			});

			if (originInstanceId && originInstanceId === InstanceStatus.id()) {
				this.orch?.getRocketChatLogger().debug({
					msg: '"apps.updated" event ignored: originated from this instance',
					appId,
				});
				return;
			}

			const storageItem = await this.orch?.getStorage()?.retrieveOne(appId);
			if (!storageItem) {
				this.orch?.getRocketChatLogger().info({
					msg: '"apps.updated" event received for app, but it could not be found in the storage',
					appId,
				});
				return;
			}

			const appPackage = await this.orch?.getAppSourceStorage()?.fetch(storageItem);
			if (!appPackage) {
				return;
			}

			const isEnabled = AppStatusUtils.isEnabled(storageItem.status);
			if (isEnabled) {
				await this.orch?.getManager()?.updateAndStartupLocal(storageItem, appPackage);
			} else {
				await this.orch?.getManager()?.updateAndInitializeLocal(storageItem, appPackage);
			}
		});

		this.onEvent('apps.statusUpdate', async (appId: string, status: AppStatus): Promise<void> => {
			this.orch?.getRocketChatLogger().debug({
				msg: '"apps.statusUpdate" event received for app with status',
				appId,
				status,
			});
			const app = this.orch?.getManager()?.getOneById(appId);
			if (!app) {
				this.orch?.getRocketChatLogger().info({
					msg: '"apps.statusUpdate" event received for app, but it could not be found in this instance',
					appId,
					status,
				});
				return;
			}

			if ((await app.getStatus()) === status) {
				this.orch?.getRocketChatLogger().info({
					msg: '"apps.statusUpdate" event received for app, but the status is the same',
					appId,
					status,
				});
				return;
			}

			if (AppStatusUtils.isEnabled(status)) {
				await this.orch?.getManager()?.enable(appId).catch(SystemLogger.error);
			} else if (AppStatusUtils.isDisabled(status)) {
				await this.orch?.getManager()?.disable(appId, status, true).catch(SystemLogger.error);
			}
		});

		this.onEvent('apps.settingUpdated', async (appId: string, setting): Promise<void> => {
			this.orch?.getRocketChatLogger().debug({
				msg: '"apps.settingUpdated" event received for app',
				appId,
				setting,
			});
			const app = this.orch?.getManager()?.getOneById(appId);
			const oldSetting = app?.getStorageItem().settings[setting.id].value;

			// avoid updating the setting if the value is the same,
			// which caused an infinite loop
			// and sometimes the settings can be an array
			// so we need to convert it to JSON stringified to compare it

			if (JSON.stringify(oldSetting) === JSON.stringify(setting.value)) {
				this.orch?.getRocketChatLogger().info({
					msg: '"apps.settingUpdated" event received for app, but the setting value is the same',
					appId,
					settingId: setting.id,
				});
				return;
			}

			await this.orch
				?.getManager()
				?.getSettingsManager()
				.updateAppSetting(appId, setting as any);
		});
	}

	isInitialized(): boolean {
		return Boolean(this.orch?.isInitialized());
	}

	isLoaded(): boolean {
		return Boolean(this.orch?.isLoaded());
	}

	async triggerEvent(event: AppEvents, ...payload: unknown[]): Promise<any> {
		return this.orch?.triggerEvent(event, ...payload);
	}

	async getApps(query: IGetAppsFilter): Promise<IAppInfo[] | undefined> {
		return (await this.orch?.getManager()?.get(query))?.map((app) => app.getInfo());
	}

	async getAppStorageItemById(appId: string): Promise<IAppStorageItem | undefined> {
		const app = this.orch?.getManager()?.getOneById(appId);

		if (!app) {
			return;
		}

		return app.getStorageItem();
	}

	async getAppsStatusLocal(): Promise<{ status: AppStatus; appId: string }[]> {
		const apps = await this.orch?.getManager()?.get();

		if (!apps) {
			return [];
		}

		return Promise.all(
			apps.map(async (app) => ({
				status: await app.getStatus(),
				appId: app.getID(),
			})),
		);
	}

	async getAppsStatusInNodes(): Promise<AppStatusReport> {
		if (!isRunningMs()) {
			throw new Error('Getting apps status in cluster is only available in microservices mode');
		}

		if (!this.api) {
			throw new Error('AppsEngineService is not initialized');
		}

		// If we are running MS AND this.api is defined, we KNOW there is a local node
		/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
		const { id: localNodeId } = (await this.api.nodeList()).find((node) => node.local)!;

		const services: { name: string; nodes: string[] }[] = await this.api?.call('$node.services', { onlyActive: true });

		// We can filter out the local node because we already know its status
		const availableNodes = services?.find((service) => service.name === 'apps-engine')?.nodes;

		// Subtract 1 for the local node
		if (!availableNodes || availableNodes.length - 1 < 1) {
			throw new AppsEngineNoNodesFoundError();
		}

		const statusByApp: AppStatusReport = {};

		const apps: Promise<void>[] = availableNodes.map(async (nodeID) => {
			const appsStatus: Awaited<ReturnType<typeof this.getAppsStatusLocal>> | undefined = await this.api?.call(
				'apps-engine.getAppsStatusLocal',
				[],
				{ nodeID },
			);

			if (!appsStatus) {
				throw new Error(`Failed to get apps status from node ${nodeID}`);
			}

			appsStatus.forEach(({ status, appId }) => {
				if (!statusByApp[appId]) {
					statusByApp[appId] = [];
				}

				statusByApp[appId].push({ instanceId: nodeID, isLocal: nodeID === localNodeId, status });
			});
		});

		await Promise.all(apps);

		return statusByApp;
	}

	private getVideoConfProviderManager(): AppVideoConfProviderManager {
		const { orch } = this;
		if (!orch?.isLoaded()) {
			throw new Error('apps-engine-not-loaded');
		}

		const manager = orch.getManager()?.getVideoConfProviderManager();
		if (!manager) {
			// availabilityErrors.NO_APP
			throw new Error('no-videoconf-provider-app');
		}

		return manager;
	}

	public readonly videoConfProviders: IAppsVideoConfProviders = {
		isFullyConfigured: (providerName) => this.getVideoConfProviderManager().isFullyConfigured(providerName),
		getVideoConferenceInfo: (providerName, call, user) =>
			this.getVideoConfProviderManager().getVideoConferenceInfo(providerName, call, user),
		generateUrl: (providerName, call) => this.getVideoConfProviderManager().generateUrl(providerName, call),
		customizeUrl: (providerName, call, user, options) => this.getVideoConfProviderManager().customizeUrl(providerName, call, user, options),
		onNewVideoConference: (providerName, call) => this.getVideoConfProviderManager().onNewVideoConference(providerName, call),
		onVideoConferenceChanged: (providerName, call) => this.getVideoConfProviderManager().onVideoConferenceChanged(providerName, call),
		onUserJoin: (providerName, call, user) => this.getVideoConfProviderManager().onUserJoin(providerName, call, user),
	};

	private getOutboundProviderManager(): AppOutboundCommunicationProviderManager {
		const { orch } = this;
		if (!orch?.isLoaded()) {
			throw new Error('apps-engine-not-loaded');
		}

		const manager = orch.getManager()?.getOutboundCommunicationProviderManager();
		if (!manager) {
			throw new Error('apps-engine-not-configured-correctly');
		}

		return manager;
	}

	public readonly outboundProviders: IAppsOutboundProviders = {
		getProviderMetadata: (appId, type) => this.getOutboundProviderManager().getProviderMetadata(appId, type),
		sendOutboundMessage: (appId, type, message) => this.getOutboundProviderManager().sendOutboundMessage(appId, type, message),
	};
}
