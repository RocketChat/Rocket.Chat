import type { IApi } from '@rocket.chat/apps-engine/definition/api';
import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api/IApiEndpointMetadata';
import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent/IExternalComponent';
import type { IOutboundMessageProviders } from '@rocket.chat/apps-engine/definition/outboundCommunication';
import type { IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { ISlashCommand } from '@rocket.chat/apps-engine/definition/slashcommands';
import type { IUIActionButtonDescriptor } from '@rocket.chat/apps-engine/definition/ui';
import type { IVideoConfProvider } from '@rocket.chat/apps-engine/definition/videoConfProviders';

import type { AppManager } from '../AppManager';

/**
 * Internal, engine-owned bridge that fronts the host manager registries and the app's settings
 * storage for the subprocess. It is deliberately NOT part of the app-facing {@link AppBridges}
 * surface (which orchestrator embeddings must implement) - it is a concrete class living in
 * `packages/apps` and delegating to the managers that also live here. The subprocess reaches it
 * through the same `bridges:*` channel as any other bridge; `BaseRuntimeSubprocessController`
 * resolves the `getAppResourceBridge` name via a dedicated lookup rather than through `AppBridges`.
 *
 * This is the compromise described in docs/base-runtime-accessor-consolidation.md §4: the
 * registration/configuration surface cannot move into the sandbox (the registries are host state,
 * read by the host UI/event/dispatch layers and used to arbitrate cross-app conflicts), so the
 * accessor *behavior* (validation/shaping/stashing) lives in the runtime while the *state and
 * enforcement* stay here, reachable through a uniform `do*` surface.
 *
 * Permission and conflict semantics are preserved because each method delegates to the same manager
 * the host accessor used: `AppVideoConfProviderManager.addProvider` /
 * `AppOutboundCommunicationProviderManager.addProvider` still throw `PermissionDeniedError`;
 * `UIActionButtonManager.registerActionButton` still logs-and-refuses; the slash-command/api
 * conflict errors still propagate. The propagated error travels back as a JSON-RPC error exactly as
 * it did through `handleAccessorMessage`.
 */
export class AppResourceBridge {
	/**
	 * The registration methods that must be suppressed while a subprocess is restarting. Re-running
	 * `app:initialize` must not double-register resources that are already registered on the host,
	 * but the subprocess still rebuilds its local `AppObjectRegistry` entries. This mirrors the old
	 * `handleAccessorMessage` guard that short-circuited the `getConfigurationExtend` origin, but is
	 * keyed on an explicit method set rather than a name prefix so the guarded surface stays
	 * auditable and decoupled from naming discipline.
	 *
	 * NOTE: this is exactly the `getConfigurationExtend` provide/register surface - not the
	 * read/update/modify/enable/disable methods, which are safe to run during a restart.
	 */
	public static readonly REGISTRATION_METHODS: ReadonlySet<string> = new Set([
		'doProvideSlashCommand',
		'doProvideApi',
		'doRegisterProcessors',
		'doRegisterActionButton',
		'doRegisterExternalComponent',
		'doProvideVideoConfProvider',
		'doRegisterOutboundProvider',
		'doProvideSetting',
	]);

	constructor(private readonly manager: AppManager) {}

	// --- Slash commands (AppSlashCommandManager) ---

	public async doProvideSlashCommand(command: ISlashCommand, appId: string): Promise<void> {
		await this.manager.getCommandManager().addCommand(appId, command);
	}

	public async doModifySlashCommand(command: ISlashCommand, appId: string): Promise<void> {
		await this.manager.getCommandManager().modifyCommand(appId, command);
	}

	public async doEnableSlashCommand(command: string, appId: string): Promise<void> {
		await this.manager.getCommandManager().enableCommand(appId, command);
	}

	public async doDisableSlashCommand(command: string, appId: string): Promise<void> {
		await this.manager.getCommandManager().disableCommand(appId, command);
	}

	// --- HTTP APIs (AppApiManager) ---

	public async doProvideApi(api: IApi, appId: string): Promise<void> {
		this.manager.getApiManager().addApi(appId, api);
	}

	public async doListApis(appId: string): Promise<Array<IApiEndpointMetadata>> {
		return this.manager.getApiManager().listApis(appId);
	}

	// --- Scheduler (AppSchedulerManager) ---

	public async doRegisterProcessors(processors: Array<IProcessor>, appId: string): Promise<void | Array<string>> {
		return this.manager.getSchedulerManager().registerProcessors(processors, appId);
	}

	// --- UI action buttons (UIActionButtonManager) ---

	public async doRegisterActionButton(button: IUIActionButtonDescriptor, appId: string): Promise<void> {
		this.manager.getUIActionButtonManager().registerActionButton(appId, button);
	}

	// --- External components (AppExternalComponentManager) ---

	public async doRegisterExternalComponent(externalComponent: IExternalComponent, appId: string): Promise<void> {
		this.manager.getExternalComponentManager().addExternalComponent(appId, externalComponent);
	}

	// --- Video conference providers (AppVideoConfProviderManager) ---

	public async doProvideVideoConfProvider(provider: IVideoConfProvider, appId: string): Promise<void> {
		this.manager.getVideoConfProviderManager().addProvider(appId, provider);
	}

	// --- Outbound message providers (AppOutboundCommunicationProviderManager) ---

	public async doRegisterOutboundProvider(provider: IOutboundMessageProviders, appId: string): Promise<void> {
		this.manager.getOutboundCommunicationProviderManager().addProvider(appId, provider);
	}

	// --- App settings (ProxiedApp storage item + AppSettingsManager) ---

	/** Mirrors the host `SettingsExtend.provideSetting`. */
	public async doProvideSetting(setting: ISetting, appId: string): Promise<void> {
		const storageItem = this.manager.getOneById(appId).getStorageItem();
		const existing = storageItem.settings[setting.id];

		if (existing) {
			setting.createdAt = existing.createdAt;
			setting.updatedAt = new Date();
			setting.value = existing.value;

			storageItem.settings[setting.id] = setting;

			return;
		}

		setting.createdAt = new Date();
		setting.updatedAt = new Date();
		storageItem.settings[setting.id] = setting;
	}

	/** Mirrors the host `SettingRead.getById`. */
	public async doGetSettingById(id: string, appId: string): Promise<ISetting> {
		return this.manager.getOneById(appId).getStorageItem().settings[id];
	}

	/** Mirrors the host `SettingUpdater.updateValue`. */
	public async doUpdateSettingValue(id: ISetting['id'], value: ISetting['value'], appId: string): Promise<void> {
		const storageItem = this.manager.getOneById(appId).getStorageItem();

		if (!storageItem.settings?.[id]) {
			throw new Error(`Setting "${id}" not found for app ${appId}`);
		}

		const setting = this.manager.getSettingsManager().getAppSetting(appId, id);

		await this.manager.getSettingsManager().updateAppSetting(appId, {
			...setting,
			updatedAt: new Date(),
			value,
		});
	}

	/** Mirrors the host `SettingUpdater.updateSelectOptions`. */
	public async doUpdateSettingSelectOptions(id: ISetting['id'], values: ISetting['values'], appId: string): Promise<void> {
		const storageItem = this.manager.getOneById(appId).getStorageItem();

		if (!storageItem.settings?.[id]) {
			throw new Error(`Setting "${id}" not found for app ${appId}`);
		}

		const setting = this.manager.getSettingsManager().getAppSetting(appId, id);

		await this.manager.getSettingsManager().updateAppSetting(appId, {
			...setting,
			updatedAt: new Date(),
			values,
		});
	}
}
