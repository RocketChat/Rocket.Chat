import type { IApiExtend } from '@rocket.chat/apps-engine/definition/accessors/IApiExtend';
import type { IAppAccessors } from '@rocket.chat/apps-engine/definition/accessors/IAppAccessors';
import type { IConfigurationExtend } from '@rocket.chat/apps-engine/definition/accessors/IConfigurationExtend';
import type { IConfigurationModify } from '@rocket.chat/apps-engine/definition/accessors/IConfigurationModify';
import type { IEnvironmentRead } from '@rocket.chat/apps-engine/definition/accessors/IEnvironmentRead';
import type { IEnvironmentWrite } from '@rocket.chat/apps-engine/definition/accessors/IEnvironmentWrite';
import type { IHttp, IHttpExtend } from '@rocket.chat/apps-engine/definition/accessors/IHttp';
import type { IModify } from '@rocket.chat/apps-engine/definition/accessors/IModify';
import type { INotifier } from '@rocket.chat/apps-engine/definition/accessors/INotifier';
import type { IOutboundCommunicationProviderExtend } from '@rocket.chat/apps-engine/definition/accessors/IOutboundCommunicationProviderExtend';
import type { IPersistence } from '@rocket.chat/apps-engine/definition/accessors/IPersistence';
import type { IRead } from '@rocket.chat/apps-engine/definition/accessors/IRead';
import type { ISchedulerExtend } from '@rocket.chat/apps-engine/definition/accessors/ISchedulerExtend';
import type { ISlashCommandsExtend } from '@rocket.chat/apps-engine/definition/accessors/ISlashCommandsExtend';
import type { ISlashCommandsModify } from '@rocket.chat/apps-engine/definition/accessors/ISlashCommandsModify';
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
import { formatErrorResponse } from './formatResponseErrorHandler';
import { Http } from './http';
import { AppObjectRegistry } from '../../AppObjectRegistry';
import { RemoteBridges } from '../bridges/RemoteBridges';
import * as Messenger from '../messenger';
import { EnvironmentRead } from './environment/EnvironmentRead';
import { EnvironmentWrite } from './environment/EnvironmentWrite';
import { EnvironmentalVariableRead } from './environment/EnvironmentalVariableRead';
import { ServerSettingRead } from './environment/ServerSettingRead';
import { ServerSettingUpdater } from './environment/ServerSettingUpdater';
import { ServerSettingsModify } from './environment/ServerSettingsModify';
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

/** Helper: extends T with an internal _proxy property used for delegation. */
type WithProxy<T> = T & { _proxy: T };

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

	private readonly bridges: RemoteBridges;

	private proxify: <T>(namespace: string, overrides?: Record<string, (...args: unknown[]) => unknown>) => T;

	constructor(private readonly senderFn: typeof Messenger.sendRequest) {
		this.bridges = new RemoteBridges(senderFn);

		this.proxify = <T>(namespace: string, overrides: Record<string, (...args: unknown[]) => unknown> = {}): T =>
			new Proxy(
				{ __kind: `accessor:${namespace}` },
				{
					get:
						(_target: unknown, prop: string) =>
						(...params: unknown[]) => {
							// We don't want to send a request for this prop
							if (prop === 'toJSON') {
								return {};
							}

							// If the prop is inteded to be overriden by the caller
							if (prop in overrides) {
								return overrides[prop].apply(undefined, params);
							}

							return senderFn({
								method: `accessor:${namespace}:${prop}`,
								params,
							})
								.then((response) => response.result)
								.catch((err) => {
									throw formatErrorResponse(err);
								});
						},
				},
			) as T;

		this.http = new Http(this.getReader(), this.getPersistence(), this.httpExtend, this.getSenderFn());
		this.notifier = new Notifier(this.getSenderFn());
	}

	public getSenderFn() {
		return this.senderFn;
	}

	public getEnvironmentRead(): IEnvironmentRead {
		if (!this.environmentRead) {
			// App settings (`getSettings`) remain proxied to the host until Phase 3 (they are
			// backed by the host ProxiedApp storage item); server settings and environment
			// variables now run locally against their bridges.
			this.environmentRead = new EnvironmentRead(
				this.proxify('getEnvironmentRead:getSettings'),
				new ServerSettingRead(this.bridges),
				new EnvironmentalVariableRead(this.bridges),
			);
		}

		return this.environmentRead;
	}

	public getEnvironmentWrite() {
		if (!this.environmentWriter) {
			// App-settings updates (`getSettings`) remain proxied to the host until Phase 3.
			this.environmentWriter = new EnvironmentWrite(
				this.proxify('getEnvironmentWrite:getSettings'),
				new ServerSettingUpdater(this.bridges),
			);
		}

		return this.environmentWriter;
	}

	public getConfigurationModify() {
		if (!this.configModifier) {
			const slashCommandsModify: WithProxy<ISlashCommandsModify> = {
				_proxy: this.proxify('getConfigurationModify:slashCommands'),
				modifySlashCommand(slashcommand: ISlashCommand) {
					// Store the slashcommand instance to use when the Apps-Engine calls the slashcommand
					AppObjectRegistry.set(`slashcommand:${slashcommand.command}`, slashcommand);

					return this._proxy.modifySlashCommand(slashcommand);
				},
				disableSlashCommand(command: string) {
					return this._proxy.disableSlashCommand(command);
				},
				enableSlashCommand(command: string) {
					return this._proxy.enableSlashCommand(command);
				},
			};

			this.configModifier = {
				scheduler: this.proxify('getConfigurationModify:scheduler'),
				slashCommands: slashCommandsModify,
				serverSettings: new ServerSettingsModify(this.bridges),
			};
		}

		return this.configModifier;
	}

	public getConfigurationExtend() {
		if (!this.configExtender) {
			const { senderFn } = this;

			const apiExtend: WithProxy<IApiExtend> = {
				_proxy: this.proxify('getConfigurationExtend:api'),
				async provideApi(api: IApi) {
					const apiEndpoints = AppObjectRegistry.get<IApiEndpointMetadata[]>('apiEndpoints')!;

					api.endpoints.forEach((endpoint) => {
						endpoint._availableMethods = httpMethods.filter((method) => typeof endpoint[method] === 'function');

						// We need to keep a reference to the endpoint around for us to call the executor later
						AppObjectRegistry.set(`api:${endpoint.path}`, endpoint);
					});

					const result = await this._proxy.provideApi(api);

					// Let's call the listApis method to cache the info from the endpoints
					// Also, since this is a side-effect, we do it async so we can return to the caller
					senderFn({ method: 'accessor:api:listApis' })
						.then((response) => apiEndpoints.push(...(response.result as IApiEndpointMetadata[])))
						.catch((err) => err.error);

					return result;
				},
			};

			const schedulerExtend: WithProxy<ISchedulerExtend> = {
				_proxy: this.proxify('getConfigurationExtend:scheduler'),
				registerProcessors(processors: IProcessor[]) {
					// Store the processor instance to use when the Apps-Engine calls the processor
					processors.forEach((processor) => {
						AppObjectRegistry.set(`scheduler:${processor.id}`, processor);
					});

					return this._proxy.registerProcessors(processors);
				},
			};

			const videoConfProviders: WithProxy<IVideoConfProvidersExtend> = {
				_proxy: this.proxify('getConfigurationExtend:videoConfProviders'),
				provideVideoConfProvider(provider: IVideoConfProvider) {
					// Store the videoConfProvider instance to use when the Apps-Engine calls the videoConfProvider
					AppObjectRegistry.set(`videoConfProvider:${provider.name}`, provider);

					return this._proxy.provideVideoConfProvider(provider);
				},
			};

			const outboundCommunication: WithProxy<IOutboundCommunicationProviderExtend> = {
				_proxy: this.proxify('getConfigurationExtend:outboundCommunication'),
				registerEmailProvider(provider: IOutboundEmailMessageProvider) {
					AppObjectRegistry.set(`outboundCommunication:${provider.name}-${provider.type}`, provider);
					return this._proxy.registerEmailProvider(provider);
				},
				registerPhoneProvider(provider: IOutboundPhoneMessageProvider) {
					AppObjectRegistry.set(`outboundCommunication:${provider.name}-${provider.type}`, provider);
					return this._proxy.registerPhoneProvider(provider);
				},
			};

			const slashCommandsExtend: WithProxy<ISlashCommandsExtend> = {
				_proxy: this.proxify('getConfigurationExtend:slashCommands'),
				provideSlashCommand(slashcommand: ISlashCommand) {
					// Store the slashcommand instance to use when the Apps-Engine calls the slashcommand
					AppObjectRegistry.set(`slashcommand:${slashcommand.command}`, slashcommand);

					return this._proxy.provideSlashCommand(slashcommand);
				},
			};

			this.configExtender = {
				ui: this.proxify('getConfigurationExtend:ui'),
				http: this.httpExtend,
				settings: this.proxify('getConfigurationExtend:settings'),
				externalComponents: this.proxify('getConfigurationExtend:externalComponents'),
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
			// The environment sub-reader keeps its own `getSettings` proxy namespace
			// (`getReader:getEnvironmentReader:getSettings`) so the app-settings path stays
			// byte-for-byte until Phase 3; server settings and env vars run locally.
			const environmentReader = new EnvironmentRead(
				this.proxify('getReader:getEnvironmentReader:getSettings'),
				new ServerSettingRead(this.bridges),
				new EnvironmentalVariableRead(this.bridges),
			);

			this.reader = new Reader(
				environmentReader,
				new MessageRead(this.bridges),
				new PersistenceRead(this.bridges),
				new RoomRead(this.bridges),
				new UserRead(this.bridges),
				this.getNotifier(),
				new LivechatRead(this.bridges),
				new UploadRead(this.bridges),
				new CloudWorkspaceRead(this.bridges),
				new VideoConferenceRead(this.bridges),
				new ContactRead(this.bridges),
				new OAuthAppsReader(this.bridges),
				new ThreadRead(this.bridges),
				new RoleRead(this.bridges),
				new ExperimentalRead(this.bridges),
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
				getDeleter: () => new ModifyDeleter(this.bridges),
				getNotifier: () => this.getNotifier(),
				getUiController: () => new UIController(this.bridges),
				getScheduler: () => new SchedulerModify(this.bridges),
				getOAuthAppsModifier: () => new OAuthAppsModify(this.bridges),
				getModerationModifier: () => new ModerationModify(this.bridges),
			};
		}

		return this.modifier;
	}

	public getPersistence() {
		if (!this.persistence) {
			this.persistence = new Persistence(this.bridges);
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

	private getNotifier() {
		return this.notifier;
	}
}

export const AppAccessorsInstance = new AppAccessors(Messenger.sendRequest);
