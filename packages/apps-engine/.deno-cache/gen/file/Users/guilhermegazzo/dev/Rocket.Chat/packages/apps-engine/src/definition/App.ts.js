import { AppStatus } from './AppStatus';
export class App {
  info;
  logger;
  accessors;
  status;
  /**
     * Create a new App, this is called whenever the server starts up and initiates the Apps.
     * Note, your implementation of this class should call `super(name, id, version)` so we have it.
     * Also, please use the `initialize()` method to do items instead of the constructor as the constructor
     * *might* be called more than once but the `initialize()` will only be called once.
     */ constructor(info, logger, accessors){
    this.info = info;
    this.logger = logger;
    this.accessors = accessors;
    this.status = AppStatus.UNKNOWN;
    this.logger.debug(`Constructed the App ${this.info.name} (${this.info.id})`, `v${this.info.version} which depends on the API v${this.info.requiredApiVersion}!`, `Created by ${this.info.author.name}`);
    this.setStatus(AppStatus.CONSTRUCTED);
  }
  async getStatus() {
    return this.status;
  }
  /**
     * Get the name of this App.
     *
     * @return {string} the name
     */ getName() {
    return this.info.name;
  }
  /**
     * Gets the sluggified name of this App.
     *
     * @return {string} the name slugged
     */ getNameSlug() {
    return this.info.nameSlug;
  }
  /**
     * Gets the username of this App's app user.
     *
     * @return {string} the username of the app user
     *
     * @deprecated This method will be removed in the next major version.
     * Please use read.getUserReader().getAppUser() instead.
     */ getAppUserUsername() {
    return `${this.info.nameSlug}.bot`;
  }
  /**
     * Get the ID of this App, please see <link> for how to obtain an ID for your App.
     *
     * @return {number} the ID
     */ getID() {
    return this.info.id;
  }
  /**
     * Get the version of this App, using http://semver.org/.
     *
     * @return {string} the version
     */ getVersion() {
    return this.info.version;
  }
  /**
     * Get the description of this App, mostly used to show to the clients/administrators.
     *
     * @return {string} the description
     */ getDescription() {
    return this.info.description;
  }
  /**
     * Gets the API Version which this App depends on (http://semver.org/).
     * This property is used for the dependency injections.
     *
     * @return {string} the required api version
     */ getRequiredApiVersion() {
    return this.info.requiredApiVersion;
  }
  /**
     * Gets the information regarding the author/maintainer of this App.
     *
     * @return author information
     */ getAuthorInfo() {
    return this.info.author;
  }
  /**
     * Gets the entirity of the App's information.
     *
     * @return App information
     */ getInfo() {
    return this.info;
  }
  /**
     * Gets the ILogger instance for this App.
     *
     * @return the logger instance
     */ getLogger() {
    return this.logger;
  }
  getAccessors() {
    return this.accessors;
  }
  /**
     * Method which will be called when the App is initialized. This is the recommended place
     * to add settings and slash commands. If an error is thrown, all commands will be unregistered.
     */ async initialize(configurationExtend, environmentRead) {
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
     */ async onEnable(environment, configurationModify) {
    return true;
  }
  /**
     * Method which is called when this App is disabled and it can be called several times.
     * If this App was enabled and then the user disabled it, this method will be called.
     */ async onDisable(configurationModify) {}
  /**
     * Method which is called when the App is uninstalled and it is called one single time.
     *
     * This method will NOT be called when an App is getting disabled manually, ONLY when
     * it's being uninstalled from Rocket.Chat.
     */ async onUninstall(context, read, http, persistence, modify) {}
  /**
     * Method which is called when the App is installed and it is called one single time.
     *
     * This method is NOT called when the App is updated.
     */ async onInstall(context, read, http, persistence, modify) {}
  /**
     * Method which is called when the App is updated and it is called one single time.
     *
     * This method is NOT called when the App is installed.
     */ async onUpdate(context, read, http, persistence, modify) {}
  /**
     * Method which is called whenever a setting which belongs to this App has been updated
     * by an external system and not this App itself. The setting passed is the newly updated one.
     *
     * @param setting the setting which was updated
     * @param configurationModify the accessor to modifiy the system
     * @param reader the reader accessor
     * @param http an accessor to the outside world
     */ async onSettingUpdated(setting, configurationModify, read, http) {}
  /**
     * Method which is called before a setting which belongs to this App is going to be updated
     * by an external system and not this App itself. The setting passed is the newly updated one.
     *
     * @param setting the setting which is going to be updated
     * @param configurationModify the accessor to modifiy the system
     * @param reader the reader accessor
     * @param http an accessor to the outside world
     */ async onPreSettingUpdate(context, configurationModify, read, http) {
    return context.newSetting;
  }
  /**
     * Method will be called during initialization. It allows for adding custom configuration options and defaults
     * @param configuration
     */ async extendConfiguration(configuration, environmentRead) {}
  /**
     * Sets the status this App is now at, use only when 100% true (it's protected for a reason).
     *
     * @param status the new status of this App
     */ async setStatus(status) {
    this.logger.debug(`The status is now: ${status}`);
    this.status = status;
  }
  // Avoid leaking references if object is serialized (e.g. to be sent over IPC)
  toJSON() {
    return this.info;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZ3VpbGhlcm1lZ2F6em8vZGV2L1JvY2tldC5DaGF0L3BhY2thZ2VzL2FwcHMtZW5naW5lL3NyYy9kZWZpbml0aW9uL0FwcC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBTdGF0dXMgfSBmcm9tICcuL0FwcFN0YXR1cyc7XG5pbXBvcnQgdHlwZSB7IElBcHAgfSBmcm9tICcuL0lBcHAnO1xuaW1wb3J0IHR5cGUge1xuICAgIElBcHBBY2Nlc3NvcnMsXG4gICAgSUFwcEluc3RhbGxhdGlvbkNvbnRleHQsXG4gICAgSUFwcFVuaW5zdGFsbGF0aW9uQ29udGV4dCxcbiAgICBJQ29uZmlndXJhdGlvbkV4dGVuZCxcbiAgICBJQ29uZmlndXJhdGlvbk1vZGlmeSxcbiAgICBJRW52aXJvbm1lbnRSZWFkLFxuICAgIElIdHRwLFxuICAgIElMb2dnZXIsXG4gICAgSU1vZGlmeSxcbiAgICBJUGVyc2lzdGVuY2UsXG4gICAgSVJlYWQsXG4gICAgSUFwcFVwZGF0ZUNvbnRleHQsXG59IGZyb20gJy4vYWNjZXNzb3JzJztcbmltcG9ydCB0eXBlIHsgSUFwcEF1dGhvckluZm8gfSBmcm9tICcuL21ldGFkYXRhL0lBcHBBdXRob3JJbmZvJztcbmltcG9ydCB0eXBlIHsgSUFwcEluZm8gfSBmcm9tICcuL21ldGFkYXRhL0lBcHBJbmZvJztcbmltcG9ydCB0eXBlIHsgSVNldHRpbmcgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB0eXBlIHsgSVNldHRpbmdVcGRhdGVDb250ZXh0IH0gZnJvbSAnLi9zZXR0aW5ncy9JU2V0dGluZ1VwZGF0ZUNvbnRleHQnO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQXBwIGltcGxlbWVudHMgSUFwcCB7XG4gICAgcHJpdmF0ZSBzdGF0dXM6IEFwcFN0YXR1cyA9IEFwcFN0YXR1cy5VTktOT1dOO1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IEFwcCwgdGhpcyBpcyBjYWxsZWQgd2hlbmV2ZXIgdGhlIHNlcnZlciBzdGFydHMgdXAgYW5kIGluaXRpYXRlcyB0aGUgQXBwcy5cbiAgICAgKiBOb3RlLCB5b3VyIGltcGxlbWVudGF0aW9uIG9mIHRoaXMgY2xhc3Mgc2hvdWxkIGNhbGwgYHN1cGVyKG5hbWUsIGlkLCB2ZXJzaW9uKWAgc28gd2UgaGF2ZSBpdC5cbiAgICAgKiBBbHNvLCBwbGVhc2UgdXNlIHRoZSBgaW5pdGlhbGl6ZSgpYCBtZXRob2QgdG8gZG8gaXRlbXMgaW5zdGVhZCBvZiB0aGUgY29uc3RydWN0b3IgYXMgdGhlIGNvbnN0cnVjdG9yXG4gICAgICogKm1pZ2h0KiBiZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2UgYnV0IHRoZSBgaW5pdGlhbGl6ZSgpYCB3aWxsIG9ubHkgYmUgY2FsbGVkIG9uY2UuXG4gICAgICovXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IGluZm86IElBcHBJbmZvLFxuICAgICAgICBwcml2YXRlIHJlYWRvbmx5IGxvZ2dlcjogSUxvZ2dlcixcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBhY2Nlc3NvcnM/OiBJQXBwQWNjZXNzb3JzLFxuICAgICkge1xuICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhcbiAgICAgICAgICAgIGBDb25zdHJ1Y3RlZCB0aGUgQXBwICR7dGhpcy5pbmZvLm5hbWV9ICgke3RoaXMuaW5mby5pZH0pYCxcbiAgICAgICAgICAgIGB2JHt0aGlzLmluZm8udmVyc2lvbn0gd2hpY2ggZGVwZW5kcyBvbiB0aGUgQVBJIHYke3RoaXMuaW5mby5yZXF1aXJlZEFwaVZlcnNpb259IWAsXG4gICAgICAgICAgICBgQ3JlYXRlZCBieSAke3RoaXMuaW5mby5hdXRob3IubmFtZX1gLFxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuc2V0U3RhdHVzKEFwcFN0YXR1cy5DT05TVFJVQ1RFRCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGdldFN0YXR1cygpOiBQcm9taXNlPEFwcFN0YXR1cz4ge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0dXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBuYW1lIG9mIHRoaXMgQXBwLlxuICAgICAqXG4gICAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgbmFtZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXROYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmluZm8ubmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBzbHVnZ2lmaWVkIG5hbWUgb2YgdGhpcyBBcHAuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBuYW1lIHNsdWdnZWRcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0TmFtZVNsdWcoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mby5uYW1lU2x1ZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSB1c2VybmFtZSBvZiB0aGlzIEFwcCdzIGFwcCB1c2VyLlxuICAgICAqXG4gICAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgdXNlcm5hbWUgb2YgdGhlIGFwcCB1c2VyXG4gICAgICpcbiAgICAgKiBAZGVwcmVjYXRlZCBUaGlzIG1ldGhvZCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIG5leHQgbWFqb3IgdmVyc2lvbi5cbiAgICAgKiBQbGVhc2UgdXNlIHJlYWQuZ2V0VXNlclJlYWRlcigpLmdldEFwcFVzZXIoKSBpbnN0ZWFkLlxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRBcHBVc2VyVXNlcm5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuaW5mby5uYW1lU2x1Z30uYm90YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIElEIG9mIHRoaXMgQXBwLCBwbGVhc2Ugc2VlIDxsaW5rPiBmb3IgaG93IHRvIG9idGFpbiBhbiBJRCBmb3IgeW91ciBBcHAuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtudW1iZXJ9IHRoZSBJRFxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRJRCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5pbmZvLmlkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdmVyc2lvbiBvZiB0aGlzIEFwcCwgdXNpbmcgaHR0cDovL3NlbXZlci5vcmcvLlxuICAgICAqXG4gICAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgdmVyc2lvblxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRWZXJzaW9uKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmluZm8udmVyc2lvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGRlc2NyaXB0aW9uIG9mIHRoaXMgQXBwLCBtb3N0bHkgdXNlZCB0byBzaG93IHRvIHRoZSBjbGllbnRzL2FkbWluaXN0cmF0b3JzLlxuICAgICAqXG4gICAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgZGVzY3JpcHRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0RGVzY3JpcHRpb24oKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mby5kZXNjcmlwdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBBUEkgVmVyc2lvbiB3aGljaCB0aGlzIEFwcCBkZXBlbmRzIG9uIChodHRwOi8vc2VtdmVyLm9yZy8pLlxuICAgICAqIFRoaXMgcHJvcGVydHkgaXMgdXNlZCBmb3IgdGhlIGRlcGVuZGVuY3kgaW5qZWN0aW9ucy5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIHJlcXVpcmVkIGFwaSB2ZXJzaW9uXG4gICAgICovXG4gICAgcHVibGljIGdldFJlcXVpcmVkQXBpVmVyc2lvbigpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5pbmZvLnJlcXVpcmVkQXBpVmVyc2lvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBpbmZvcm1hdGlvbiByZWdhcmRpbmcgdGhlIGF1dGhvci9tYWludGFpbmVyIG9mIHRoaXMgQXBwLlxuICAgICAqXG4gICAgICogQHJldHVybiBhdXRob3IgaW5mb3JtYXRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0QXV0aG9ySW5mbygpOiBJQXBwQXV0aG9ySW5mbyB7XG4gICAgICAgIHJldHVybiB0aGlzLmluZm8uYXV0aG9yO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGVudGlyaXR5IG9mIHRoZSBBcHAncyBpbmZvcm1hdGlvbi5cbiAgICAgKlxuICAgICAqIEByZXR1cm4gQXBwIGluZm9ybWF0aW9uXG4gICAgICovXG4gICAgcHVibGljIGdldEluZm8oKTogSUFwcEluZm8ge1xuICAgICAgICByZXR1cm4gdGhpcy5pbmZvO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIElMb2dnZXIgaW5zdGFuY2UgZm9yIHRoaXMgQXBwLlxuICAgICAqXG4gICAgICogQHJldHVybiB0aGUgbG9nZ2VyIGluc3RhbmNlXG4gICAgICovXG4gICAgcHVibGljIGdldExvZ2dlcigpOiBJTG9nZ2VyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9nZ2VyO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRBY2Nlc3NvcnMoKTogSUFwcEFjY2Vzc29ycyB7XG4gICAgICAgIHJldHVybiB0aGlzLmFjY2Vzc29ycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2Qgd2hpY2ggd2lsbCBiZSBjYWxsZWQgd2hlbiB0aGUgQXBwIGlzIGluaXRpYWxpemVkLiBUaGlzIGlzIHRoZSByZWNvbW1lbmRlZCBwbGFjZVxuICAgICAqIHRvIGFkZCBzZXR0aW5ncyBhbmQgc2xhc2ggY29tbWFuZHMuIElmIGFuIGVycm9yIGlzIHRocm93biwgYWxsIGNvbW1hbmRzIHdpbGwgYmUgdW5yZWdpc3RlcmVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBpbml0aWFsaXplKGNvbmZpZ3VyYXRpb25FeHRlbmQ6IElDb25maWd1cmF0aW9uRXh0ZW5kLCBlbnZpcm9ubWVudFJlYWQ6IElFbnZpcm9ubWVudFJlYWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5leHRlbmRDb25maWd1cmF0aW9uKGNvbmZpZ3VyYXRpb25FeHRlbmQsIGVudmlyb25tZW50UmVhZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoaXMgQXBwIGlzIGVuYWJsZWQgYW5kIGNhbiBiZSBjYWxsZWQgc2V2ZXJhbFxuICAgICAqIHRpbWVzIGR1cmluZyB0aGlzIGluc3RhbmNlJ3MgbGlmZSB0aW1lLiBPbmNlIGFmdGVyIHRoZSBgaW5pdGlhbGl6ZSgpYCBpcyBjYWxsZWQsXG4gICAgICogcGVuZGluZyBpdCBkb2Vzbid0IHRocm93IGFuIGVycm9yLCBhbmQgdGhlbiBhbnl0aW1lIHRoZSBBcHAgaXMgZW5hYmxlZCBieSB0aGUgdXNlci5cbiAgICAgKiBJZiB0aGlzIG1ldGhvZCwgYG9uRW5hYmxlKClgLCByZXR1cm5zIGZhbHNlLCB0aGVuIHRoaXMgQXBwIHdpbGwgbm90XG4gICAgICogYWN0dWFsbHkgYmUgZW5hYmxlZCAoZXg6IGEgc2V0dGluZyBpc24ndCBjb25maWd1cmVkKS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4gd2hldGhlciB0aGUgQXBwIHNob3VsZCBiZSBlbmFibGVkIG9yIG5vdFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBvbkVuYWJsZShlbnZpcm9ubWVudDogSUVudmlyb25tZW50UmVhZCwgY29uZmlndXJhdGlvbk1vZGlmeTogSUNvbmZpZ3VyYXRpb25Nb2RpZnkpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoaXMgQXBwIGlzIGRpc2FibGVkIGFuZCBpdCBjYW4gYmUgY2FsbGVkIHNldmVyYWwgdGltZXMuXG4gICAgICogSWYgdGhpcyBBcHAgd2FzIGVuYWJsZWQgYW5kIHRoZW4gdGhlIHVzZXIgZGlzYWJsZWQgaXQsIHRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBvbkRpc2FibGUoY29uZmlndXJhdGlvbk1vZGlmeTogSUNvbmZpZ3VyYXRpb25Nb2RpZnkpOiBQcm9taXNlPHZvaWQ+IHt9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2Qgd2hpY2ggaXMgY2FsbGVkIHdoZW4gdGhlIEFwcCBpcyB1bmluc3RhbGxlZCBhbmQgaXQgaXMgY2FsbGVkIG9uZSBzaW5nbGUgdGltZS5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgTk9UIGJlIGNhbGxlZCB3aGVuIGFuIEFwcCBpcyBnZXR0aW5nIGRpc2FibGVkIG1hbnVhbGx5LCBPTkxZIHdoZW5cbiAgICAgKiBpdCdzIGJlaW5nIHVuaW5zdGFsbGVkIGZyb20gUm9ja2V0LkNoYXQuXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIG9uVW5pbnN0YWxsKGNvbnRleHQ6IElBcHBVbmluc3RhbGxhdGlvbkNvbnRleHQsIHJlYWQ6IElSZWFkLCBodHRwOiBJSHR0cCwgcGVyc2lzdGVuY2U6IElQZXJzaXN0ZW5jZSwgbW9kaWZ5OiBJTW9kaWZ5KTogUHJvbWlzZTx2b2lkPiB7fVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoZSBBcHAgaXMgaW5zdGFsbGVkIGFuZCBpdCBpcyBjYWxsZWQgb25lIHNpbmdsZSB0aW1lLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgaXMgTk9UIGNhbGxlZCB3aGVuIHRoZSBBcHAgaXMgdXBkYXRlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgb25JbnN0YWxsKGNvbnRleHQ6IElBcHBJbnN0YWxsYXRpb25Db250ZXh0LCByZWFkOiBJUmVhZCwgaHR0cDogSUh0dHAsIHBlcnNpc3RlbmNlOiBJUGVyc2lzdGVuY2UsIG1vZGlmeTogSU1vZGlmeSk6IFByb21pc2U8dm9pZD4ge31cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB3aGljaCBpcyBjYWxsZWQgd2hlbiB0aGUgQXBwIGlzIHVwZGF0ZWQgYW5kIGl0IGlzIGNhbGxlZCBvbmUgc2luZ2xlIHRpbWUuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBOT1QgY2FsbGVkIHdoZW4gdGhlIEFwcCBpcyBpbnN0YWxsZWQuXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIG9uVXBkYXRlKGNvbnRleHQ6IElBcHBVcGRhdGVDb250ZXh0LCByZWFkOiBJUmVhZCwgaHR0cDogSUh0dHAsIHBlcnNpc3RlbmNlOiBJUGVyc2lzdGVuY2UsIG1vZGlmeTogSU1vZGlmeSk6IFByb21pc2U8dm9pZD4ge31cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB3aGljaCBpcyBjYWxsZWQgd2hlbmV2ZXIgYSBzZXR0aW5nIHdoaWNoIGJlbG9uZ3MgdG8gdGhpcyBBcHAgaGFzIGJlZW4gdXBkYXRlZFxuICAgICAqIGJ5IGFuIGV4dGVybmFsIHN5c3RlbSBhbmQgbm90IHRoaXMgQXBwIGl0c2VsZi4gVGhlIHNldHRpbmcgcGFzc2VkIGlzIHRoZSBuZXdseSB1cGRhdGVkIG9uZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzZXR0aW5nIHRoZSBzZXR0aW5nIHdoaWNoIHdhcyB1cGRhdGVkXG4gICAgICogQHBhcmFtIGNvbmZpZ3VyYXRpb25Nb2RpZnkgdGhlIGFjY2Vzc29yIHRvIG1vZGlmaXkgdGhlIHN5c3RlbVxuICAgICAqIEBwYXJhbSByZWFkZXIgdGhlIHJlYWRlciBhY2Nlc3NvclxuICAgICAqIEBwYXJhbSBodHRwIGFuIGFjY2Vzc29yIHRvIHRoZSBvdXRzaWRlIHdvcmxkXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIG9uU2V0dGluZ1VwZGF0ZWQoc2V0dGluZzogSVNldHRpbmcsIGNvbmZpZ3VyYXRpb25Nb2RpZnk6IElDb25maWd1cmF0aW9uTW9kaWZ5LCByZWFkOiBJUmVhZCwgaHR0cDogSUh0dHApOiBQcm9taXNlPHZvaWQ+IHt9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2Qgd2hpY2ggaXMgY2FsbGVkIGJlZm9yZSBhIHNldHRpbmcgd2hpY2ggYmVsb25ncyB0byB0aGlzIEFwcCBpcyBnb2luZyB0byBiZSB1cGRhdGVkXG4gICAgICogYnkgYW4gZXh0ZXJuYWwgc3lzdGVtIGFuZCBub3QgdGhpcyBBcHAgaXRzZWxmLiBUaGUgc2V0dGluZyBwYXNzZWQgaXMgdGhlIG5ld2x5IHVwZGF0ZWQgb25lLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNldHRpbmcgdGhlIHNldHRpbmcgd2hpY2ggaXMgZ29pbmcgdG8gYmUgdXBkYXRlZFxuICAgICAqIEBwYXJhbSBjb25maWd1cmF0aW9uTW9kaWZ5IHRoZSBhY2Nlc3NvciB0byBtb2RpZml5IHRoZSBzeXN0ZW1cbiAgICAgKiBAcGFyYW0gcmVhZGVyIHRoZSByZWFkZXIgYWNjZXNzb3JcbiAgICAgKiBAcGFyYW0gaHR0cCBhbiBhY2Nlc3NvciB0byB0aGUgb3V0c2lkZSB3b3JsZFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBvblByZVNldHRpbmdVcGRhdGUoY29udGV4dDogSVNldHRpbmdVcGRhdGVDb250ZXh0LCBjb25maWd1cmF0aW9uTW9kaWZ5OiBJQ29uZmlndXJhdGlvbk1vZGlmeSwgcmVhZDogSVJlYWQsIGh0dHA6IElIdHRwKTogUHJvbWlzZTxJU2V0dGluZz4ge1xuICAgICAgICByZXR1cm4gY29udGV4dC5uZXdTZXR0aW5nO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB3aWxsIGJlIGNhbGxlZCBkdXJpbmcgaW5pdGlhbGl6YXRpb24uIEl0IGFsbG93cyBmb3IgYWRkaW5nIGN1c3RvbSBjb25maWd1cmF0aW9uIG9wdGlvbnMgYW5kIGRlZmF1bHRzXG4gICAgICogQHBhcmFtIGNvbmZpZ3VyYXRpb25cbiAgICAgKi9cbiAgICBwcm90ZWN0ZWQgYXN5bmMgZXh0ZW5kQ29uZmlndXJhdGlvbihjb25maWd1cmF0aW9uOiBJQ29uZmlndXJhdGlvbkV4dGVuZCwgZW52aXJvbm1lbnRSZWFkOiBJRW52aXJvbm1lbnRSZWFkKTogUHJvbWlzZTx2b2lkPiB7fVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgc3RhdHVzIHRoaXMgQXBwIGlzIG5vdyBhdCwgdXNlIG9ubHkgd2hlbiAxMDAlIHRydWUgKGl0J3MgcHJvdGVjdGVkIGZvciBhIHJlYXNvbikuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RhdHVzIHRoZSBuZXcgc3RhdHVzIG9mIHRoaXMgQXBwXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIHNldFN0YXR1cyhzdGF0dXM6IEFwcFN0YXR1cyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLmxvZ2dlci5kZWJ1ZyhgVGhlIHN0YXR1cyBpcyBub3c6ICR7c3RhdHVzfWApO1xuICAgICAgICB0aGlzLnN0YXR1cyA9IHN0YXR1cztcbiAgICB9XG5cbiAgICAvLyBBdm9pZCBsZWFraW5nIHJlZmVyZW5jZXMgaWYgb2JqZWN0IGlzIHNlcmlhbGl6ZWQgKGUuZy4gdG8gYmUgc2VudCBvdmVyIElQQylcbiAgICBwdWJsaWMgdG9KU09OKCk6IFJlY29yZDxzdHJpbmcsIGFueT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5pbmZvO1xuICAgIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLFNBQVMsUUFBUSxjQUFjO0FBcUJ4QyxPQUFPLE1BQWU7Ozs7RUFDVixPQUFzQztFQUU5Qzs7Ozs7S0FLQyxHQUNELFlBQ0ksQUFBaUIsSUFBYyxFQUMvQixBQUFpQixNQUFlLEVBQ2hDLEFBQWlCLFNBQXlCLENBQzVDO1NBSG1CLE9BQUE7U0FDQSxTQUFBO1NBQ0EsWUFBQTtTQVhiLFNBQW9CLFVBQVUsT0FBTztJQWF6QyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FDYixDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJ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