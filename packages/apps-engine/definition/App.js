"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const AppStatus_1 = require("./AppStatus");
class App {
    /**
     * Create a new App, this is called whenever the server starts up and initiates the Apps.
     * Note, your implementation of this class should call `super(name, id, version)` so we have it.
     * Also, please use the `initialize()` method to do items instead of the constructor as the constructor
     * *might* be called more than once but the `initialize()` will only be called once.
     */
    constructor(info, logger, accessors) {
        this.info = info;
        this.logger = logger;
        this.accessors = accessors;
        this.status = AppStatus_1.AppStatus.UNKNOWN;
        this.logger.debug(`Constructed the App ${this.info.name} (${this.info.id})`, `v${this.info.version} which depends on the API v${this.info.requiredApiVersion}!`, `Created by ${this.info.author.name}`);
        this.setStatus(AppStatus_1.AppStatus.CONSTRUCTED);
    }
    getStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.status;
        });
    }
    /**
     * Get the name of this App.
     *
     * @return {string} the name
     */
    getName() {
        return this.info.name;
    }
    /**
     * Gets the sluggified name of this App.
     *
     * @return {string} the name slugged
     */
    getNameSlug() {
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
    getAppUserUsername() {
        return `${this.info.nameSlug}.bot`;
    }
    /**
     * Get the ID of this App, please see <link> for how to obtain an ID for your App.
     *
     * @return {number} the ID
     */
    getID() {
        return this.info.id;
    }
    /**
     * Get the version of this App, using http://semver.org/.
     *
     * @return {string} the version
     */
    getVersion() {
        return this.info.version;
    }
    /**
     * Get the description of this App, mostly used to show to the clients/administrators.
     *
     * @return {string} the description
     */
    getDescription() {
        return this.info.description;
    }
    /**
     * Gets the API Version which this App depends on (http://semver.org/).
     * This property is used for the dependency injections.
     *
     * @return {string} the required api version
     */
    getRequiredApiVersion() {
        return this.info.requiredApiVersion;
    }
    /**
     * Gets the information regarding the author/maintainer of this App.
     *
     * @return author information
     */
    getAuthorInfo() {
        return this.info.author;
    }
    /**
     * Gets the entirity of the App's information.
     *
     * @return App information
     */
    getInfo() {
        return this.info;
    }
    /**
     * Gets the ILogger instance for this App.
     *
     * @return the logger instance
     */
    getLogger() {
        return this.logger;
    }
    getAccessors() {
        return this.accessors;
    }
    /**
     * Method which will be called when the App is initialized. This is the recommended place
     * to add settings and slash commands. If an error is thrown, all commands will be unregistered.
     */
    initialize(configurationExtend, environmentRead) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.extendConfiguration(configurationExtend, environmentRead);
        });
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
    onEnable(environment, configurationModify) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    /**
     * Method which is called when this App is disabled and it can be called several times.
     * If this App was enabled and then the user disabled it, this method will be called.
     */
    onDisable(configurationModify) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Method which is called when the App is uninstalled and it is called one single time.
     *
     * This method will NOT be called when an App is getting disabled manually, ONLY when
     * it's being uninstalled from Rocket.Chat.
     */
    onUninstall(context, read, http, persistence, modify) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Method which is called when the App is installed and it is called one single time.
     *
     * This method is NOT called when the App is updated.
     */
    onInstall(context, read, http, persistence, modify) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Method which is called when the App is updated and it is called one single time.
     *
     * This method is NOT called when the App is installed.
     */
    onUpdate(context, read, http, persistence, modify) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Method which is called whenever a setting which belongs to this App has been updated
     * by an external system and not this App itself. The setting passed is the newly updated one.
     *
     * @param setting the setting which was updated
     * @param configurationModify the accessor to modifiy the system
     * @param reader the reader accessor
     * @param http an accessor to the outside world
     */
    onSettingUpdated(setting, configurationModify, read, http) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Method which is called before a setting which belongs to this App is going to be updated
     * by an external system and not this App itself. The setting passed is the newly updated one.
     *
     * @param setting the setting which is going to be updated
     * @param configurationModify the accessor to modifiy the system
     * @param reader the reader accessor
     * @param http an accessor to the outside world
     */
    onPreSettingUpdate(context, configurationModify, read, http) {
        return __awaiter(this, void 0, void 0, function* () {
            return context.newSetting;
        });
    }
    /**
     * Method will be called during initialization. It allows for adding custom configuration options and defaults
     * @param configuration
     */
    extendConfiguration(configuration, environmentRead) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    /**
     * Sets the status this App is now at, use only when 100% true (it's protected for a reason).
     *
     * @param status the new status of this App
     */
    setStatus(status) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug(`The status is now: ${status}`);
            this.status = status;
        });
    }
    // Avoid leaking references if object is serialized (e.g. to be sent over IPC)
    toJSON() {
        return this.info;
    }
}
exports.App = App;
//# sourceMappingURL=App.js.map