import type {
    IConfigurationExtend,
    IConfigurationModify,
    IEnvironmentRead,
    IEnvironmentWrite,
    IHttp,
    IHttpExtend,
    IModify,
    IPersistence,
    IRead,
} from '../../definition/accessors';
import type { AppManager } from '../AppManager';
import {
    ApiExtend,
    ConfigurationExtend,
    ConfigurationModify,
    EnvironmentalVariableRead,
    EnvironmentRead,
    EnvironmentWrite,
    ExternalComponentsExtend,
    Http,
    HttpExtend,
    LivechatRead,
    MessageRead,
    Modify,
    Notifier,
    OAuthAppsReader,
    Persistence,
    PersistenceRead,
    Reader,
    RoleRead,
    RoomRead,
    SchedulerExtend,
    SchedulerModify,
    ServerSettingRead,
    ServerSettingsModify,
    ServerSettingUpdater,
    SettingRead,
    SettingsExtend,
    SettingUpdater,
    SlashCommandsExtend,
    SlashCommandsModify,
    UploadRead,
    UserRead,
    VideoConferenceRead,
    VideoConfProviderExtend,
} from '../accessors';
import { CloudWorkspaceRead } from '../accessors/CloudWorkspaceRead';
import { ContactRead } from '../accessors/ContactRead';
import { ThreadRead } from '../accessors/ThreadRead';
import { UIExtend } from '../accessors/UIExtend';
import type { AppBridges } from '../bridges/AppBridges';

export class AppAccessorManager {
    private readonly bridges: AppBridges;

    private readonly configExtenders: Map<string, IConfigurationExtend>;

    private readonly envReaders: Map<string, IEnvironmentRead>;

    private readonly envWriters: Map<string, IEnvironmentWrite>;

    private readonly configModifiers: Map<string, IConfigurationModify>;

    private readonly readers: Map<string, IRead>;

    private readonly modifiers: Map<string, IModify>;

    private readonly persists: Map<string, IPersistence>;

    private readonly https: Map<string, IHttp>;

    constructor(private readonly manager: AppManager) {
        this.bridges = this.manager.getBridges();
        this.configExtenders = new Map<string, IConfigurationExtend>();
        this.envReaders = new Map<string, IEnvironmentRead>();
        this.envWriters = new Map<string, IEnvironmentWrite>();
        this.configModifiers = new Map<string, IConfigurationModify>();
        this.readers = new Map<string, IRead>();
        this.modifiers = new Map<string, IModify>();
        this.persists = new Map<string, IPersistence>();
        this.https = new Map<string, IHttp>();
    }

    /**
     * Purifies the accessors for the provided App.
     *
     * @param appId The id of the App to purge the accessors for.
     */
    public purifyApp(appId: string): void {
        this.configExtenders.delete(appId);
        this.envReaders.delete(appId);
        this.envWriters.delete(appId);
        this.configModifiers.delete(appId);
        this.readers.delete(appId);
        this.modifiers.delete(appId);
        this.persists.delete(appId);
        this.https.delete(appId);
    }

    public getConfigurationExtend(appId: string): IConfigurationExtend {
        if (!this.configExtenders.has(appId)) {
            const rl = this.manager.getOneById(appId);

            if (!rl) {
                throw new Error(`No App found by the provided id: ${appId}`);
            }

            const htt = new HttpExtend();
            const cmds = new SlashCommandsExtend(this.manager.getCommandManager(), appId);
            const videoConf = new VideoConfProviderExtend(this.manager.getVideoConfProviderManager(), appId);
            const apis = new ApiExtend(this.manager.getApiManager(), appId);
            const sets = new SettingsExtend(rl);
            const excs = new ExternalComponentsExtend(this.manager.getExternalComponentManager(), appId);
            const scheduler = new SchedulerExtend(this.manager.getSchedulerManager(), appId);
            const ui = new UIExtend(this.manager.getUIActionButtonManager(), appId);

            this.configExtenders.set(appId, new ConfigurationExtend(htt, sets, cmds, apis, excs, scheduler, ui, videoConf));
        }

        return this.configExtenders.get(appId);
    }

    public getEnvironmentRead(appId: string): IEnvironmentRead {
        if (!this.envReaders.has(appId)) {
            const rl = this.manager.getOneById(appId);

            if (!rl) {
                throw new Error(`No App found by the provided id: ${appId}`);
            }

            const sets = new SettingRead(rl);
            const servsets = new ServerSettingRead(this.bridges.getServerSettingBridge(), appId);
            const env = new EnvironmentalVariableRead(this.bridges.getEnvironmentalVariableBridge(), appId);

            this.envReaders.set(appId, new EnvironmentRead(sets, servsets, env));
        }

        return this.envReaders.get(appId);
    }

    public getEnvironmentWrite(appId: string): IEnvironmentWrite {
        if (!this.envWriters.has(appId)) {
            const rl = this.manager.getOneById(appId);

            if (!rl) {
                throw new Error(`No App found by the provided id: ${appId}`);
            }

            const sets = new SettingUpdater(rl, this.manager.getSettingsManager());
            const serverSetting = new ServerSettingUpdater(this.bridges, appId);

            this.envWriters.set(appId, new EnvironmentWrite(sets, serverSetting));
        }

        return this.envWriters.get(appId);
    }

    public getConfigurationModify(appId: string): IConfigurationModify {
        if (!this.configModifiers.has(appId)) {
            this.configModifiers.set(
                appId,
                new ConfigurationModify(
                    new ServerSettingsModify(this.bridges.getServerSettingBridge(), appId),
                    new SlashCommandsModify(this.manager.getCommandManager(), appId),
                    new SchedulerModify(this.bridges.getSchedulerBridge(), appId),
                ),
            );
        }

        return this.configModifiers.get(appId);
    }

    public getReader(appId: string): IRead {
        if (!this.readers.has(appId)) {
            const env = this.getEnvironmentRead(appId);
            const msg = new MessageRead(this.bridges.getMessageBridge(), appId);
            const persist = new PersistenceRead(this.bridges.getPersistenceBridge(), appId);
            const room = new RoomRead(this.bridges.getRoomBridge(), appId);
            const user = new UserRead(this.bridges.getUserBridge(), appId);
            const noti = new Notifier(this.bridges.getUserBridge(), this.bridges.getMessageBridge(), appId);
            const livechat = new LivechatRead(this.bridges.getLivechatBridge(), appId);
            const upload = new UploadRead(this.bridges.getUploadBridge(), appId);
            const cloud = new CloudWorkspaceRead(this.bridges.getCloudWorkspaceBridge(), appId);
            const videoConf = new VideoConferenceRead(this.bridges.getVideoConferenceBridge(), appId);
            const oauthApps = new OAuthAppsReader(this.bridges.getOAuthAppsBridge(), appId);
            const contactReader = new ContactRead(this.bridges, appId);
            const thread = new ThreadRead(this.bridges.getThreadBridge(), appId);

            const role = new RoleRead(this.bridges.getRoleBridge(), appId);

            this.readers.set(
                appId,
                new Reader(env, msg, persist, room, user, noti, livechat, upload, cloud, videoConf, contactReader, oauthApps, thread, role),
            );
        }

        return this.readers.get(appId);
    }

    public getModifier(appId: string): IModify {
        if (!this.modifiers.has(appId)) {
            this.modifiers.set(appId, new Modify(this.bridges, appId));
        }

        return this.modifiers.get(appId);
    }

    public getPersistence(appId: string): IPersistence {
        if (!this.persists.has(appId)) {
            this.persists.set(appId, new Persistence(this.bridges.getPersistenceBridge(), appId));
        }

        return this.persists.get(appId);
    }

    public getHttp(appId: string): IHttp {
        if (!this.https.has(appId)) {
            let ext: IHttpExtend;
            if (this.configExtenders.has(appId)) {
                ext = this.configExtenders.get(appId).http;
            } else {
                const cf = this.getConfigurationExtend(appId);
                ext = cf.http;
            }

            this.https.set(appId, new Http(this, this.bridges, ext, appId));
        }

        return this.https.get(appId);
    }
}
