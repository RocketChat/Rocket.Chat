import type { IApiExtend } from '@rocket.chat/apps-engine/definition/accessors/IApiExtend';
import type { IAppAccessors } from '@rocket.chat/apps-engine/definition/accessors/IAppAccessors';
import type { IConfigurationExtend } from '@rocket.chat/apps-engine/definition/accessors/IConfigurationExtend';
import type { IConfigurationModify } from '@rocket.chat/apps-engine/definition/accessors/IConfigurationModify';
import type { IEnvironmentRead } from '@rocket.chat/apps-engine/definition/accessors/IEnvironmentRead';
import type { IEnvironmentWrite } from '@rocket.chat/apps-engine/definition/accessors/IEnvironmentWrite';
import type { IExternalComponentsExtend } from '@rocket.chat/apps-engine/definition/accessors/IExternalComponentsExtend';
import type { IHttp, IHttpExtend } from '@rocket.chat/apps-engine/definition/accessors/IHttp';
import type { IModify } from '@rocket.chat/apps-engine/definition/accessors/IModify';
import type { INotifier } from '@rocket.chat/apps-engine/definition/accessors/INotifier';
import type { IOutboundCommunicationProviderExtend } from '@rocket.chat/apps-engine/definition/accessors/IOutboundCommunicationProviderExtend';
import type { IPersistence } from '@rocket.chat/apps-engine/definition/accessors/IPersistence';
import type { IRead } from '@rocket.chat/apps-engine/definition/accessors/IRead';
import type { ISchedulerExtend } from '@rocket.chat/apps-engine/definition/accessors/ISchedulerExtend';
import type { ISettingsExtend } from '@rocket.chat/apps-engine/definition/accessors/ISettingsExtend';
import type { ISlashCommandsExtend } from '@rocket.chat/apps-engine/definition/accessors/ISlashCommandsExtend';
import type { ISlashCommandsModify } from '@rocket.chat/apps-engine/definition/accessors/ISlashCommandsModify';
import type { IUIExtend } from '@rocket.chat/apps-engine/definition/accessors/IUIExtend';
import type { IVideoConfProvidersExtend } from '@rocket.chat/apps-engine/definition/accessors/IVideoConfProvidersExtend';
import type { IApi } from '@rocket.chat/apps-engine/definition/api/IApi';
import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api/IApiEndpointMetadata';
import type {
	IOutboundPhoneMessageProvider,
	IOutboundEmailMessageProvider,
} from '@rocket.chat/apps-engine/definition/outboundCommunication/IOutboundCommsProvider';
import type { IProcessor } from '@rocket.chat/apps-engine/definition/scheduler/IProcessor';
import type { ISlashCommand } from '@rocket.chat/apps-engine/definition/slashcommands/ISlashCommand';
import type { IVideoConfProvider } from '@rocket.chat/apps-engine/definition/videoConfProviders/IVideoConfProvider';

import { Persistence } from './Persistence';
import { HttpExtend } from './extenders/HttpExtender';
import { Http } from './http';
import { AppObjectRegistry } from '../../AppObjectRegistry';
import { bridgeCall } from '../bridges/bridgeCall';
import * as Messenger from '../messenger';
import { EnvironmentRead } from './environment/EnvironmentRead';
import { EnvironmentWrite } from './environment/EnvironmentWrite';
import { EnvironmentalVariableRead } from './environment/EnvironmentalVariableRead';
import { ServerSettingRead } from './environment/ServerSettingRead';
import { ServerSettingUpdater } from './environment/ServerSettingUpdater';
import { ServerSettingsModify } from './environment/ServerSettingsModify';
import { SettingRead } from './environment/SettingRead';
import { SettingUpdater } from './environment/SettingUpdater';
import { ModerationModify } from './modify/ModerationModify';
import { ModifyCreator } from './modify/ModifyCreator';
import { ModifyDeleter } from './modify/ModifyDeleter';
import { ModifyExtender } from './modify/ModifyExtender';
import { ModifyUpdater } from './modify/ModifyUpdater';
import { OAuthAppsModify } from './modify/OAuthAppsModify';
import { SchedulerModify } from './modify/SchedulerModify';
import { UIController } from './modify/UIController';
import { Notifier } from './notifier';
import { CloudWorkspaceRead } from './read/CloudWorkspaceRead';
import { ContactRead } from './read/ContactRead';
import { ExperimentalRead } from './read/ExperimentalRead';
import { LivechatRead } from './read/LivechatRead';
import { MessageRead } from './read/MessageRead';
import { OAuthAppsReader } from './read/OAuthAppsReader';
import { PersistenceRead } from './read/PersistenceRead';
import { Reader } from './read/Reader';
import { RoleRead } from './read/RoleRead';
import { RoomRead } from './read/RoomRead';
import { ThreadRead } from './read/ThreadRead';
import { UploadRead } from './read/UploadRead';
import { UserRead } from './read/UserRead';
import { VideoConferenceRead } from './read/VideoConferenceRead';

const httpMethods = ['get', 'post', 'put', 'delete', 'head', 'options', 'patch'] as const;

// We need to create this object first thing, as we'll handle references to it later on
if (!AppObjectRegistry.has('apiEndpoints')) {
	AppObjectRegistry.set('apiEndpoints', []);
}

export class AppAccessors {
	private defaultAppAccessors?: IAppAccessors;

	private environmentRead?: IEnvironmentRead;

	private environmentWriter?: IEnvironmentWrite;

	private configModifier?: IConfigurationModify;

	private configExtender?: IConfigurationExtend;

	private reader?: IRead;

	private modifier?: IModify;

	private persistence?: IPersistence;

	private creator?: ModifyCreator;

	private updater?: ModifyUpdater;

	private extender?: ModifyExtender;

	private httpExtend: IHttpExtend = new HttpExtend();

	private http?: IHttp;

	private notifier?: INotifier;

	constructor(private readonly senderFn: typeof Messenger.sendRequest) {
		// `getReader()` bakes the notifier into the Reader, so the notifier has to be
		// resolvable before this line runs -- `getNotifier()` creates it on demand.
		this.http = new Http(this.getReader(), this.getPersistence(), this.httpExtend, this.getSenderFn());
	}

	public getSenderFn() {
		return this.senderFn;
	}

	public getEnvironmentRead(): IEnvironmentRead {
		if (!this.environmentRead) {
			// App settings, server settings and environment variables all run locally now; app
			// settings reach the host ProxiedApp storage item through the internal AppResourceBridge.
			this.environmentRead = new EnvironmentRead(
				new SettingRead(this.senderFn),
				new ServerSettingRead(this.senderFn),
				new EnvironmentalVariableRead(this.senderFn),
			);
		}

		return this.environmentRead;
	}

	public getEnvironmentWrite() {
		if (!this.environmentWriter) {
			this.environmentWriter = new EnvironmentWrite(new SettingUpdater(this.senderFn), new ServerSettingUpdater(this.senderFn));
		}

		return this.environmentWriter;
	}

	public getConfigurationModify() {
		if (!this.configModifier) {
			const { senderFn } = this;

			const slashCommandsModify: ISlashCommandsModify = {
				modifySlashCommand(slashcommand: ISlashCommand) {
					// Store the slashcommand instance to use when the Apps-Engine calls the slashcommand
					AppObjectRegistry.set(`slashcommand:${slashcommand.command}`, slashcommand);

					return bridgeCall<void>(senderFn, 'getAppResourceBridge', 'doModifySlashCommand', slashcommand, 'APP_ID');
				},
				disableSlashCommand(command: string) {
					return bridgeCall<void>(senderFn, 'getAppResourceBridge', 'doDisableSlashCommand', command, 'APP_ID');
				},
				enableSlashCommand(command: string) {
					return bridgeCall<void>(senderFn, 'getAppResourceBridge', 'doEnableSlashCommand', command, 'APP_ID');
				},
			};

			this.configModifier = {
				scheduler: new SchedulerModify(this.senderFn),
				slashCommands: slashCommandsModify,
				serverSettings: new ServerSettingsModify(this.senderFn),
			};
		}

		return this.configModifier;
	}

	public getConfigurationExtend() {
		if (!this.configExtender) {
			const { senderFn } = this;

			const apiExtend: IApiExtend = {
				async provideApi(api: IApi) {
					const apiEndpoints = AppObjectRegistry.get<IApiEndpointMetadata[]>('apiEndpoints')!;

					api.endpoints.forEach((endpoint) => {
						endpoint._availableMethods = httpMethods.filter((method) => typeof endpoint[method] === 'function');

						// We need to keep a reference to the endpoint around for us to call the executor later
						AppObjectRegistry.set(`api:${endpoint.path}`, endpoint);
					});

					await bridgeCall(senderFn, 'getAppResourceBridge', 'doProvideApi', api, 'APP_ID');

					// Let's call the listApis method to cache the info from the endpoints
					// Also, since this is a side-effect, we do it async so we can return to the caller
					bridgeCall(senderFn, 'getAppResourceBridge', 'doListApis', 'APP_ID')
						.then((endpoints) => apiEndpoints.push(...(endpoints as IApiEndpointMetadata[])))
						.catch(() => undefined);
				},
			};

			const schedulerExtend: ISchedulerExtend = {
				registerProcessors(processors: IProcessor[]) {
					// Store the processor instance to use when the Apps-Engine calls the processor
					processors.forEach((processor) => {
						AppObjectRegistry.set(`scheduler:${processor.id}`, processor);
					});

					return bridgeCall<void | Array<string>>(senderFn, 'getAppResourceBridge', 'doRegisterProcessors', processors, 'APP_ID');
				},
			};

			const videoConfProviders: IVideoConfProvidersExtend = {
				provideVideoConfProvider(provider: IVideoConfProvider) {
					// Store the videoConfProvider instance to use when the Apps-Engine calls the videoConfProvider
					AppObjectRegistry.set(`videoConfProvider:${provider.name}`, provider);

					return bridgeCall<void>(senderFn, 'getAppResourceBridge', 'doProvideVideoConfProvider', provider, 'APP_ID');
				},
			};

			const outboundCommunication: IOutboundCommunicationProviderExtend = {
				registerEmailProvider(provider: IOutboundEmailMessageProvider) {
					AppObjectRegistry.set(`outboundCommunication:${provider.name}-${provider.type}`, provider);
					return bridgeCall<void>(senderFn, 'getAppResourceBridge', 'doRegisterOutboundProvider', provider, 'APP_ID');
				},
				registerPhoneProvider(provider: IOutboundPhoneMessageProvider) {
					AppObjectRegistry.set(`outboundCommunication:${provider.name}-${provider.type}`, provider);
					return bridgeCall<void>(senderFn, 'getAppResourceBridge', 'doRegisterOutboundProvider', provider, 'APP_ID');
				},
			};

			const slashCommandsExtend: ISlashCommandsExtend = {
				provideSlashCommand(slashcommand: ISlashCommand) {
					// Store the slashcommand instance to use when the Apps-Engine calls the slashcommand
					AppObjectRegistry.set(`slashcommand:${slashcommand.command}`, slashcommand);

					return bridgeCall<void>(senderFn, 'getAppResourceBridge', 'doProvideSlashCommand', slashcommand, 'APP_ID');
				},
			};

			const ui: IUIExtend = {
				// `registerButton` is a synchronous `void` in the interface, but the host registration
				// is async over the bridge; fire-and-forget matches the contract. The host manager
				// logs-and-refuses rather than throwing, so there is no rejection to surface here.
				registerButton(button) {
					void bridgeCall(senderFn, 'getAppResourceBridge', 'doRegisterActionButton', button, 'APP_ID').catch(() => undefined);
				},
			};

			const settings: ISettingsExtend = {
				provideSetting(setting) {
					return bridgeCall<void>(senderFn, 'getAppResourceBridge', 'doProvideSetting', setting, 'APP_ID');
				},
			};

			const externalComponents: IExternalComponentsExtend = {
				register(externalComponent) {
					return bridgeCall<void>(senderFn, 'getAppResourceBridge', 'doRegisterExternalComponent', externalComponent, 'APP_ID');
				},
			};

			this.configExtender = {
				ui,
				http: this.httpExtend,
				settings,
				externalComponents,
				api: apiExtend,
				scheduler: schedulerExtend,
				videoConfProviders,
				outboundCommunication,
				slashCommands: slashCommandsExtend,
			};
		}

		return this.configExtender;
	}

	public getDefaultAppAccessors() {
		if (!this.defaultAppAccessors) {
			this.defaultAppAccessors = {
				environmentReader: this.getEnvironmentRead(),
				environmentWriter: this.getEnvironmentWrite(),
				reader: this.getReader(),
				http: this.getHttp(),
				providedApiEndpoints: AppObjectRegistry.get<IApiEndpointMetadata[]>('apiEndpoints') as IApiEndpointMetadata[],
			};
		}

		return this.defaultAppAccessors;
	}

	public getReader() {
		if (!this.reader) {
			const environmentReader = new EnvironmentRead(
				new SettingRead(this.senderFn),
				new ServerSettingRead(this.senderFn),
				new EnvironmentalVariableRead(this.senderFn),
			);

			this.reader = new Reader(
				environmentReader,
				new MessageRead(this.senderFn),
				new PersistenceRead(this.senderFn),
				new RoomRead(this.senderFn),
				new UserRead(this.senderFn),
				this.getNotifier(),
				new LivechatRead(this.senderFn),
				new UploadRead(this.senderFn),
				new CloudWorkspaceRead(this.senderFn),
				new VideoConferenceRead(this.senderFn),
				new ContactRead(this.senderFn),
				new OAuthAppsReader(this.senderFn),
				new ThreadRead(this.senderFn),
				new RoleRead(this.senderFn),
				new ExperimentalRead(this.senderFn),
			);
		}

		return this.reader;
	}

	public getModifier() {
		if (!this.modifier) {
			this.modifier = {
				getCreator: this.getCreator.bind(this),
				getUpdater: this.getUpdater.bind(this),
				getExtender: this.getExtender.bind(this),
				getDeleter: () => new ModifyDeleter(this.senderFn),
				getNotifier: () => this.getNotifier(),
				getUiController: () => new UIController(this.senderFn),
				getScheduler: () => new SchedulerModify(this.senderFn),
				getOAuthAppsModifier: () => new OAuthAppsModify(this.senderFn),
				getModerationModifier: () => new ModerationModify(this.senderFn),
			};
		}

		return this.modifier;
	}

	public getPersistence() {
		if (!this.persistence) {
			this.persistence = new Persistence(this.senderFn);
		}

		return this.persistence;
	}

	public getHttp() {
		return this.http;
	}

	private getCreator() {
		if (!this.creator) {
			this.creator = new ModifyCreator(this.senderFn);
		}

		return this.creator;
	}

	private getUpdater() {
		if (!this.updater) {
			this.updater = new ModifyUpdater(this.senderFn);
		}

		return this.updater;
	}

	private getExtender() {
		if (!this.extender) {
			this.extender = new ModifyExtender(this.senderFn);
		}

		return this.extender;
	}

	private getNotifier(): INotifier {
		if (!this.notifier) {
			this.notifier = new Notifier(this.senderFn);
		}

		return this.notifier;
	}
}

export const AppAccessorsInstance = new AppAccessors(Messenger.sendRequest);
