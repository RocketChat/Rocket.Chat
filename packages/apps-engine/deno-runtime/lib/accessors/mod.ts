import type { IAppAccessors } from '@rocket.chat/apps-engine/definition/accessors/IAppAccessors.ts';
import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api/IApiEndpointMetadata.ts';
import type { IEnvironmentWrite } from '@rocket.chat/apps-engine/definition/accessors/IEnvironmentWrite.ts';
import type { IEnvironmentRead } from '@rocket.chat/apps-engine/definition/accessors/IEnvironmentRead.ts';
import type { IConfigurationModify } from '@rocket.chat/apps-engine/definition/accessors/IConfigurationModify.ts';
import type { IRead } from '@rocket.chat/apps-engine/definition/accessors/IRead.ts';
import type { IModify } from '@rocket.chat/apps-engine/definition/accessors/IModify.ts';
import type { INotifier } from '@rocket.chat/apps-engine/definition/accessors/INotifier.ts';
import type { IPersistence } from '@rocket.chat/apps-engine/definition/accessors/IPersistence.ts';
import type { IHttp, IHttpExtend } from '@rocket.chat/apps-engine/definition/accessors/IHttp.ts';
import type { IConfigurationExtend } from '@rocket.chat/apps-engine/definition/accessors/IConfigurationExtend.ts';
import type { ISlashCommand } from '@rocket.chat/apps-engine/definition/slashcommands/ISlashCommand.ts';
import type { IProcessor } from '@rocket.chat/apps-engine/definition/scheduler/IProcessor.ts';
import type { IApi } from '@rocket.chat/apps-engine/definition/api/IApi.ts';
import type { IVideoConfProvider } from '@rocket.chat/apps-engine/definition/videoConfProviders/IVideoConfProvider.ts';

import { Http } from './http.ts';
import { HttpExtend } from './extenders/HttpExtender.ts';
import * as Messenger from '../messenger.ts';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { ModifyCreator } from './modify/ModifyCreator.ts';
import { ModifyUpdater } from './modify/ModifyUpdater.ts';
import { ModifyExtender } from './modify/ModifyExtender.ts';
import { Notifier } from './notifier.ts';

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

    private proxify: <T>(namespace: string, overrides?: Record<string, (...args: unknown[]) => unknown>) => T;

    constructor(private readonly senderFn: typeof Messenger.sendRequest) {
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
                                .catch((err) => { throw new Error(err.error) });
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
            this.environmentRead = {
                getSettings: () => this.proxify('getEnvironmentRead:getSettings'),
                getServerSettings: () => this.proxify('getEnvironmentRead:getServerSettings'),
                getEnvironmentVariables: () => this.proxify('getEnvironmentRead:getEnvironmentVariables'),
            };
        }

        return this.environmentRead;
    }

    public getEnvironmentWrite() {
        if (!this.environmentWriter) {
            this.environmentWriter = {
                getSettings: () => this.proxify('getEnvironmentWrite:getSettings'),
                getServerSettings: () => this.proxify('getEnvironmentWrite:getServerSettings'),
            };
        }

        return this.environmentWriter;
    }

    public getConfigurationModify() {
        if (!this.configModifier) {
            this.configModifier = {
                scheduler: this.proxify('getConfigurationModify:scheduler'),
                slashCommands: {
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
                },
                serverSettings: this.proxify('getConfigurationModify:serverSettings'),
            };
        }

        return this.configModifier;
    }

    public getConfigurationExtend() {
        if (!this.configExtender) {
            const senderFn = this.senderFn;

            this.configExtender = {
                ui: this.proxify('getConfigurationExtend:ui'),
                http: this.httpExtend,
                settings: this.proxify('getConfigurationExtend:settings'),
                externalComponents: this.proxify('getConfigurationExtend:externalComponents'),
                api: {
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
                },
                scheduler: {
                    _proxy: this.proxify('getConfigurationExtend:scheduler'),
                    registerProcessors(processors: IProcessor[]) {
                        // Store the processor instance to use when the Apps-Engine calls the processor
                        processors.forEach((processor) => {
                            AppObjectRegistry.set(`scheduler:${processor.id}`, processor);
                        });

                        return this._proxy.registerProcessors(processors);
                    },
                },
                videoConfProviders: {
                    _proxy: this.proxify('getConfigurationExtend:videoConfProviders'),
                    provideVideoConfProvider(provider: IVideoConfProvider) {
                        // Store the videoConfProvider instance to use when the Apps-Engine calls the videoConfProvider
                        AppObjectRegistry.set(`videoConfProvider:${provider.name}`, provider);

                        return this._proxy.provideVideoConfProvider(provider);
                    },
                },
                slashCommands: {
                    _proxy: this.proxify('getConfigurationExtend:slashCommands'),
                    provideSlashCommand(slashcommand: ISlashCommand) {
                        // Store the slashcommand instance to use when the Apps-Engine calls the slashcommand
                        AppObjectRegistry.set(`slashcommand:${slashcommand.command}`, slashcommand);

                        return this._proxy.provideSlashCommand(slashcommand);
                    },
                },
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
            this.reader = {
                getEnvironmentReader: () => ({
                    getSettings: () => this.proxify('getReader:getEnvironmentReader:getSettings'),
                    getServerSettings: () => this.proxify('getReader:getEnvironmentReader:getServerSettings'),
                    getEnvironmentVariables: () => this.proxify('getReader:getEnvironmentReader:getEnvironmentVariables'),
                }),
                getMessageReader: () => this.proxify('getReader:getMessageReader'),
                getPersistenceReader: () => this.proxify('getReader:getPersistenceReader'),
                getRoomReader: () => this.proxify('getReader:getRoomReader'),
                getUserReader: () => this.proxify('getReader:getUserReader'),
                getNotifier: () => this.getNotifier(),
                getLivechatReader: () => this.proxify('getReader:getLivechatReader'),
                getUploadReader: () => this.proxify('getReader:getUploadReader'),
                getCloudWorkspaceReader: () => this.proxify('getReader:getCloudWorkspaceReader'),
                getVideoConferenceReader: () => this.proxify('getReader:getVideoConferenceReader'),
                getOAuthAppsReader: () => this.proxify('getReader:getOAuthAppsReader'),
                getThreadReader: () => this.proxify('getReader:getThreadReader'),
                getRoleReader: () => this.proxify('getReader:getRoleReader'),
            };
        }

        return this.reader;
    }

    public getModifier() {
        if (!this.modifier) {
            this.modifier = {
                getCreator: this.getCreator.bind(this),
                getUpdater: this.getUpdater.bind(this),
                getExtender: this.getExtender.bind(this),
                getDeleter: () => this.proxify('getModifier:getDeleter'),
                getNotifier: () => this.getNotifier(),
                getUiController: () => this.proxify('getModifier:getUiController'),
                getScheduler: () => this.proxify('getModifier:getScheduler'),
                getOAuthAppsModifier: () => this.proxify('getModifier:getOAuthAppsModifier'),
                getModerationModifier: () => this.proxify('getModifier:getModerationModifier'),
            };
        }

        return this.modifier;
    }

    public getPersistence() {
        if (!this.persistence) {
            this.persistence = this.proxify('getPersistence');
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
