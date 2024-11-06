import { AppStatus } from './AppStatus';
import type { IApp } from './IApp';
import type {
    IAppAccessors,
    IAppInstallationContext,
    IAppUninstallationContext,
    IConfigurationExtend,
    IConfigurationModify,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
    IAppUpdateContext,
} from './accessors';
import type { IAppAuthorInfo } from './metadata/IAppAuthorInfo';
import type { IAppInfo } from './metadata/IAppInfo';
import type { ISetting } from './settings';
import type { ISettingUpdateContext } from './settings/ISettingUpdateContext';

export abstract class App implements IApp {
    private status: AppStatus = AppStatus.UNKNOWN;

    /**
     * Create a new App, this is called whenever the server starts up and initiates the Apps.
     * Note, your implementation of this class should call `super(name, id, version)` so we have it.
     * Also, please use the `initialize()` method to do items instead of the constructor as the constructor
     * *might* be called more than once but the `initialize()` will only be called once.
     */
    public constructor(
        private readonly info: IAppInfo,
        private readonly logger: ILogger,
        private readonly accessors?: IAppAccessors,
    ) {
        this.logger.debug(
            `Constructed the App ${this.info.name} (${this.info.id})`,
            `v${this.info.version} which depends on the API v${this.info.requiredApiVersion}!`,
            `Created by ${this.info.author.name}`,
        );

        this.setStatus(AppStatus.CONSTRUCTED);
    }

    public async getStatus(): Promise<AppStatus> {
        return this.status;
    }

    /**
     * Get the name of this App.
     *
     * @return {string} the name
     */
    public getName(): string {
        return this.info.name;
    }

    /**
     * Gets the sluggified name of this App.
     *
     * @return {string} the name slugged
     */
    public getNameSlug(): string {
        return this.info.nameSlug;
    }

    /**
     * Gets the username of this App's app user.
     *
     * @return {string} the username of the app user
     *
     * @deprecated This method will be removed in the next major version.
     * Please use read.getUserReader().getAppUser() instead.
     */
    public getAppUserUsername(): string {
        return `${this.info.nameSlug}.bot`;
    }

    /**
     * Get the ID of this App, please see <link> for how to obtain an ID for your App.
     *
     * @return {number} the ID
     */
    public getID(): string {
        return this.info.id;
    }

    /**
     * Get the version of this App, using http://semver.org/.
     *
     * @return {string} the version
     */
    public getVersion(): string {
        return this.info.version;
    }

    /**
     * Get the description of this App, mostly used to show to the clients/administrators.
     *
     * @return {string} the description
     */
    public getDescription(): string {
        return this.info.description;
    }

    /**
     * Gets the API Version which this App depends on (http://semver.org/).
     * This property is used for the dependency injections.
     *
     * @return {string} the required api version
     */
    public getRequiredApiVersion(): string {
        return this.info.requiredApiVersion;
    }

    /**
     * Gets the information regarding the author/maintainer of this App.
     *
     * @return author information
     */
    public getAuthorInfo(): IAppAuthorInfo {
        return this.info.author;
    }

    /**
     * Gets the entirity of the App's information.
     *
     * @return App information
     */
    public getInfo(): IAppInfo {
        return this.info;
    }

    /**
     * Gets the ILogger instance for this App.
     *
     * @return the logger instance
     */
    public getLogger(): ILogger {
        return this.logger;
    }

    public getAccessors(): IAppAccessors {
        return this.accessors;
    }

    /**
     * Method which will be called when the App is initialized. This is the recommended place
     * to add settings and slash commands. If an error is thrown, all commands will be unregistered.
     */
    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await this.extendConfiguration(configurationExtend, environmentRead);
    }

    /**
     * Method which is called when this App is enabled and can be called several
     * times during this instance's life time. Once after the `initialize()` is called,
     * pending it doesn't throw an error, and then anytime the App is enabled by the user.
     * If this method, `onEnable()`, returns false, then this App will not
     * actually be enabled (ex: a setting isn't configured).
     *
     * @return whether the App should be enabled or not
     */
    public async onEnable(environment: IEnvironmentRead, configurationModify: IConfigurationModify): Promise<boolean> {
        return true;
    }

    /**
     * Method which is called when this App is disabled and it can be called several times.
     * If this App was enabled and then the user disabled it, this method will be called.
     */
    public async onDisable(configurationModify: IConfigurationModify): Promise<void> {}

    /**
     * Method which is called when the App is uninstalled and it is called one single time.
     *
     * This method will NOT be called when an App is getting disabled manually, ONLY when
     * it's being uninstalled from Rocket.Chat.
     */
    public async onUninstall(context: IAppUninstallationContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {}

    /**
     * Method which is called when the App is installed and it is called one single time.
     *
     * This method is NOT called when the App is updated.
     */
    public async onInstall(context: IAppInstallationContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {}

    /**
     * Method which is called when the App is updated and it is called one single time.
     *
     * This method is NOT called when the App is installed.
     */
    public async onUpdate(context: IAppUpdateContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {}

    /**
     * Method which is called whenever a setting which belongs to this App has been updated
     * by an external system and not this App itself. The setting passed is the newly updated one.
     *
     * @param setting the setting which was updated
     * @param configurationModify the accessor to modifiy the system
     * @param reader the reader accessor
     * @param http an accessor to the outside world
     */
    public async onSettingUpdated(setting: ISetting, configurationModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {}

    /**
     * Method which is called before a setting which belongs to this App is going to be updated
     * by an external system and not this App itself. The setting passed is the newly updated one.
     *
     * @param setting the setting which is going to be updated
     * @param configurationModify the accessor to modifiy the system
     * @param reader the reader accessor
     * @param http an accessor to the outside world
     */
    public async onPreSettingUpdate(context: ISettingUpdateContext, configurationModify: IConfigurationModify, read: IRead, http: IHttp): Promise<ISetting> {
        return context.newSetting;
    }

    /**
     * Method will be called during initialization. It allows for adding custom configuration options and defaults
     * @param configuration
     */
    protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {}

    /**
     * Sets the status this App is now at, use only when 100% true (it's protected for a reason).
     *
     * @param status the new status of this App
     */
    protected async setStatus(status: AppStatus): Promise<void> {
        this.logger.debug(`The status is now: ${status}`);
        this.status = status;
    }

    // Avoid leaking references if object is serialized (e.g. to be sent over IPC)
    public toJSON(): Record<string, any> {
        return this.info;
    }
}
