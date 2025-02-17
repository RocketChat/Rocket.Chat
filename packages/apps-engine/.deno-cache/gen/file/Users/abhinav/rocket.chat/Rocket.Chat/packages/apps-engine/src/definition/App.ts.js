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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvYWJoaW5hdi9yb2NrZXQuY2hhdC9Sb2NrZXQuQ2hhdC9wYWNrYWdlcy9hcHBzLWVuZ2luZS9zcmMvZGVmaW5pdGlvbi9BcHAudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwU3RhdHVzIH0gZnJvbSAnLi9BcHBTdGF0dXMnO1xuaW1wb3J0IHR5cGUgeyBJQXBwIH0gZnJvbSAnLi9JQXBwJztcbmltcG9ydCB0eXBlIHtcbiAgICBJQXBwQWNjZXNzb3JzLFxuICAgIElBcHBJbnN0YWxsYXRpb25Db250ZXh0LFxuICAgIElBcHBVbmluc3RhbGxhdGlvbkNvbnRleHQsXG4gICAgSUNvbmZpZ3VyYXRpb25FeHRlbmQsXG4gICAgSUNvbmZpZ3VyYXRpb25Nb2RpZnksXG4gICAgSUVudmlyb25tZW50UmVhZCxcbiAgICBJSHR0cCxcbiAgICBJTG9nZ2VyLFxuICAgIElNb2RpZnksXG4gICAgSVBlcnNpc3RlbmNlLFxuICAgIElSZWFkLFxuICAgIElBcHBVcGRhdGVDb250ZXh0LFxufSBmcm9tICcuL2FjY2Vzc29ycyc7XG5pbXBvcnQgdHlwZSB7IElBcHBBdXRob3JJbmZvIH0gZnJvbSAnLi9tZXRhZGF0YS9JQXBwQXV0aG9ySW5mbyc7XG5pbXBvcnQgdHlwZSB7IElBcHBJbmZvIH0gZnJvbSAnLi9tZXRhZGF0YS9JQXBwSW5mbyc7XG5pbXBvcnQgdHlwZSB7IElTZXR0aW5nIH0gZnJvbSAnLi9zZXR0aW5ncyc7XG5pbXBvcnQgdHlwZSB7IElTZXR0aW5nVXBkYXRlQ29udGV4dCB9IGZyb20gJy4vc2V0dGluZ3MvSVNldHRpbmdVcGRhdGVDb250ZXh0JztcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEFwcCBpbXBsZW1lbnRzIElBcHAge1xuICAgIHByaXZhdGUgc3RhdHVzOiBBcHBTdGF0dXMgPSBBcHBTdGF0dXMuVU5LTk9XTjtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBBcHAsIHRoaXMgaXMgY2FsbGVkIHdoZW5ldmVyIHRoZSBzZXJ2ZXIgc3RhcnRzIHVwIGFuZCBpbml0aWF0ZXMgdGhlIEFwcHMuXG4gICAgICogTm90ZSwgeW91ciBpbXBsZW1lbnRhdGlvbiBvZiB0aGlzIGNsYXNzIHNob3VsZCBjYWxsIGBzdXBlcihuYW1lLCBpZCwgdmVyc2lvbilgIHNvIHdlIGhhdmUgaXQuXG4gICAgICogQWxzbywgcGxlYXNlIHVzZSB0aGUgYGluaXRpYWxpemUoKWAgbWV0aG9kIHRvIGRvIGl0ZW1zIGluc3RlYWQgb2YgdGhlIGNvbnN0cnVjdG9yIGFzIHRoZSBjb25zdHJ1Y3RvclxuICAgICAqICptaWdodCogYmUgY2FsbGVkIG1vcmUgdGhhbiBvbmNlIGJ1dCB0aGUgYGluaXRpYWxpemUoKWAgd2lsbCBvbmx5IGJlIGNhbGxlZCBvbmNlLlxuICAgICAqL1xuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBpbmZvOiBJQXBwSW5mbyxcbiAgICAgICAgcHJpdmF0ZSByZWFkb25seSBsb2dnZXI6IElMb2dnZXIsXG4gICAgICAgIHByaXZhdGUgcmVhZG9ubHkgYWNjZXNzb3JzPzogSUFwcEFjY2Vzc29ycyxcbiAgICApIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoXG4gICAgICAgICAgICBgQ29uc3RydWN0ZWQgdGhlIEFwcCAke3RoaXMuaW5mby5uYW1lfSAoJHt0aGlzLmluZm8uaWR9KWAsXG4gICAgICAgICAgICBgdiR7dGhpcy5pbmZvLnZlcnNpb259IHdoaWNoIGRlcGVuZHMgb24gdGhlIEFQSSB2JHt0aGlzLmluZm8ucmVxdWlyZWRBcGlWZXJzaW9ufSFgLFxuICAgICAgICAgICAgYENyZWF0ZWQgYnkgJHt0aGlzLmluZm8uYXV0aG9yLm5hbWV9YCxcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLnNldFN0YXR1cyhBcHBTdGF0dXMuQ09OU1RSVUNURUQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBnZXRTdGF0dXMoKTogUHJvbWlzZTxBcHBTdGF0dXM+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbmFtZSBvZiB0aGlzIEFwcC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIG5hbWVcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0TmFtZSgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5pbmZvLm5hbWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgc2x1Z2dpZmllZCBuYW1lIG9mIHRoaXMgQXBwLlxuICAgICAqXG4gICAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgbmFtZSBzbHVnZ2VkXG4gICAgICovXG4gICAgcHVibGljIGdldE5hbWVTbHVnKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmluZm8ubmFtZVNsdWc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgdXNlcm5hbWUgb2YgdGhpcyBBcHAncyBhcHAgdXNlci5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIHVzZXJuYW1lIG9mIHRoZSBhcHAgdXNlclxuICAgICAqXG4gICAgICogQGRlcHJlY2F0ZWQgVGhpcyBtZXRob2Qgd2lsbCBiZSByZW1vdmVkIGluIHRoZSBuZXh0IG1ham9yIHZlcnNpb24uXG4gICAgICogUGxlYXNlIHVzZSByZWFkLmdldFVzZXJSZWFkZXIoKS5nZXRBcHBVc2VyKCkgaW5zdGVhZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0QXBwVXNlclVzZXJuYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLmluZm8ubmFtZVNsdWd9LmJvdGA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBJRCBvZiB0aGlzIEFwcCwgcGxlYXNlIHNlZSA8bGluaz4gZm9yIGhvdyB0byBvYnRhaW4gYW4gSUQgZm9yIHlvdXIgQXBwLlxuICAgICAqXG4gICAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgSURcbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0SUQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mby5pZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHZlcnNpb24gb2YgdGhpcyBBcHAsIHVzaW5nIGh0dHA6Ly9zZW12ZXIub3JnLy5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIHZlcnNpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0VmVyc2lvbigpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5pbmZvLnZlcnNpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBkZXNjcmlwdGlvbiBvZiB0aGlzIEFwcCwgbW9zdGx5IHVzZWQgdG8gc2hvdyB0byB0aGUgY2xpZW50cy9hZG1pbmlzdHJhdG9ycy5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIGRlc2NyaXB0aW9uXG4gICAgICovXG4gICAgcHVibGljIGdldERlc2NyaXB0aW9uKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmluZm8uZGVzY3JpcHRpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgQVBJIFZlcnNpb24gd2hpY2ggdGhpcyBBcHAgZGVwZW5kcyBvbiAoaHR0cDovL3NlbXZlci5vcmcvKS5cbiAgICAgKiBUaGlzIHByb3BlcnR5IGlzIHVzZWQgZm9yIHRoZSBkZXBlbmRlbmN5IGluamVjdGlvbnMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSByZXF1aXJlZCBhcGkgdmVyc2lvblxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRSZXF1aXJlZEFwaVZlcnNpb24oKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mby5yZXF1aXJlZEFwaVZlcnNpb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgaW5mb3JtYXRpb24gcmVnYXJkaW5nIHRoZSBhdXRob3IvbWFpbnRhaW5lciBvZiB0aGlzIEFwcC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4gYXV0aG9yIGluZm9ybWF0aW9uXG4gICAgICovXG4gICAgcHVibGljIGdldEF1dGhvckluZm8oKTogSUFwcEF1dGhvckluZm8ge1xuICAgICAgICByZXR1cm4gdGhpcy5pbmZvLmF1dGhvcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBlbnRpcml0eSBvZiB0aGUgQXBwJ3MgaW5mb3JtYXRpb24uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIEFwcCBpbmZvcm1hdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRJbmZvKCk6IElBcHBJbmZvIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mbztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBJTG9nZ2VyIGluc3RhbmNlIGZvciB0aGlzIEFwcC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4gdGhlIGxvZ2dlciBpbnN0YW5jZVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXRMb2dnZXIoKTogSUxvZ2dlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvZ2dlcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QWNjZXNzb3JzKCk6IElBcHBBY2Nlc3NvcnMge1xuICAgICAgICByZXR1cm4gdGhpcy5hY2Nlc3NvcnM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHdoaWNoIHdpbGwgYmUgY2FsbGVkIHdoZW4gdGhlIEFwcCBpcyBpbml0aWFsaXplZC4gVGhpcyBpcyB0aGUgcmVjb21tZW5kZWQgcGxhY2VcbiAgICAgKiB0byBhZGQgc2V0dGluZ3MgYW5kIHNsYXNoIGNvbW1hbmRzLiBJZiBhbiBlcnJvciBpcyB0aHJvd24sIGFsbCBjb21tYW5kcyB3aWxsIGJlIHVucmVnaXN0ZXJlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgaW5pdGlhbGl6ZShjb25maWd1cmF0aW9uRXh0ZW5kOiBJQ29uZmlndXJhdGlvbkV4dGVuZCwgZW52aXJvbm1lbnRSZWFkOiBJRW52aXJvbm1lbnRSZWFkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuZXh0ZW5kQ29uZmlndXJhdGlvbihjb25maWd1cmF0aW9uRXh0ZW5kLCBlbnZpcm9ubWVudFJlYWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB3aGljaCBpcyBjYWxsZWQgd2hlbiB0aGlzIEFwcCBpcyBlbmFibGVkIGFuZCBjYW4gYmUgY2FsbGVkIHNldmVyYWxcbiAgICAgKiB0aW1lcyBkdXJpbmcgdGhpcyBpbnN0YW5jZSdzIGxpZmUgdGltZS4gT25jZSBhZnRlciB0aGUgYGluaXRpYWxpemUoKWAgaXMgY2FsbGVkLFxuICAgICAqIHBlbmRpbmcgaXQgZG9lc24ndCB0aHJvdyBhbiBlcnJvciwgYW5kIHRoZW4gYW55dGltZSB0aGUgQXBwIGlzIGVuYWJsZWQgYnkgdGhlIHVzZXIuXG4gICAgICogSWYgdGhpcyBtZXRob2QsIGBvbkVuYWJsZSgpYCwgcmV0dXJucyBmYWxzZSwgdGhlbiB0aGlzIEFwcCB3aWxsIG5vdFxuICAgICAqIGFjdHVhbGx5IGJlIGVuYWJsZWQgKGV4OiBhIHNldHRpbmcgaXNuJ3QgY29uZmlndXJlZCkuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHdoZXRoZXIgdGhlIEFwcCBzaG91bGQgYmUgZW5hYmxlZCBvciBub3RcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgb25FbmFibGUoZW52aXJvbm1lbnQ6IElFbnZpcm9ubWVudFJlYWQsIGNvbmZpZ3VyYXRpb25Nb2RpZnk6IElDb25maWd1cmF0aW9uTW9kaWZ5KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB3aGljaCBpcyBjYWxsZWQgd2hlbiB0aGlzIEFwcCBpcyBkaXNhYmxlZCBhbmQgaXQgY2FuIGJlIGNhbGxlZCBzZXZlcmFsIHRpbWVzLlxuICAgICAqIElmIHRoaXMgQXBwIHdhcyBlbmFibGVkIGFuZCB0aGVuIHRoZSB1c2VyIGRpc2FibGVkIGl0LCB0aGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgb25EaXNhYmxlKGNvbmZpZ3VyYXRpb25Nb2RpZnk6IElDb25maWd1cmF0aW9uTW9kaWZ5KTogUHJvbWlzZTx2b2lkPiB7fVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoZSBBcHAgaXMgdW5pbnN0YWxsZWQgYW5kIGl0IGlzIGNhbGxlZCBvbmUgc2luZ2xlIHRpbWUuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIE5PVCBiZSBjYWxsZWQgd2hlbiBhbiBBcHAgaXMgZ2V0dGluZyBkaXNhYmxlZCBtYW51YWxseSwgT05MWSB3aGVuXG4gICAgICogaXQncyBiZWluZyB1bmluc3RhbGxlZCBmcm9tIFJvY2tldC5DaGF0LlxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBvblVuaW5zdGFsbChjb250ZXh0OiBJQXBwVW5pbnN0YWxsYXRpb25Db250ZXh0LCByZWFkOiBJUmVhZCwgaHR0cDogSUh0dHAsIHBlcnNpc3RlbmNlOiBJUGVyc2lzdGVuY2UsIG1vZGlmeTogSU1vZGlmeSk6IFByb21pc2U8dm9pZD4ge31cblxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB3aGljaCBpcyBjYWxsZWQgd2hlbiB0aGUgQXBwIGlzIGluc3RhbGxlZCBhbmQgaXQgaXMgY2FsbGVkIG9uZSBzaW5nbGUgdGltZS5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIE5PVCBjYWxsZWQgd2hlbiB0aGUgQXBwIGlzIHVwZGF0ZWQuXG4gICAgICovXG4gICAgcHVibGljIGFzeW5jIG9uSW5zdGFsbChjb250ZXh0OiBJQXBwSW5zdGFsbGF0aW9uQ29udGV4dCwgcmVhZDogSVJlYWQsIGh0dHA6IElIdHRwLCBwZXJzaXN0ZW5jZTogSVBlcnNpc3RlbmNlLCBtb2RpZnk6IElNb2RpZnkpOiBQcm9taXNlPHZvaWQ+IHt9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2Qgd2hpY2ggaXMgY2FsbGVkIHdoZW4gdGhlIEFwcCBpcyB1cGRhdGVkIGFuZCBpdCBpcyBjYWxsZWQgb25lIHNpbmdsZSB0aW1lLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgaXMgTk9UIGNhbGxlZCB3aGVuIHRoZSBBcHAgaXMgaW5zdGFsbGVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBvblVwZGF0ZShjb250ZXh0OiBJQXBwVXBkYXRlQ29udGV4dCwgcmVhZDogSVJlYWQsIGh0dHA6IElIdHRwLCBwZXJzaXN0ZW5jZTogSVBlcnNpc3RlbmNlLCBtb2RpZnk6IElNb2RpZnkpOiBQcm9taXNlPHZvaWQ+IHt9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2Qgd2hpY2ggaXMgY2FsbGVkIHdoZW5ldmVyIGEgc2V0dGluZyB3aGljaCBiZWxvbmdzIHRvIHRoaXMgQXBwIGhhcyBiZWVuIHVwZGF0ZWRcbiAgICAgKiBieSBhbiBleHRlcm5hbCBzeXN0ZW0gYW5kIG5vdCB0aGlzIEFwcCBpdHNlbGYuIFRoZSBzZXR0aW5nIHBhc3NlZCBpcyB0aGUgbmV3bHkgdXBkYXRlZCBvbmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2V0dGluZyB0aGUgc2V0dGluZyB3aGljaCB3YXMgdXBkYXRlZFxuICAgICAqIEBwYXJhbSBjb25maWd1cmF0aW9uTW9kaWZ5IHRoZSBhY2Nlc3NvciB0byBtb2RpZml5IHRoZSBzeXN0ZW1cbiAgICAgKiBAcGFyYW0gcmVhZGVyIHRoZSByZWFkZXIgYWNjZXNzb3JcbiAgICAgKiBAcGFyYW0gaHR0cCBhbiBhY2Nlc3NvciB0byB0aGUgb3V0c2lkZSB3b3JsZFxuICAgICAqL1xuICAgIHB1YmxpYyBhc3luYyBvblNldHRpbmdVcGRhdGVkKHNldHRpbmc6IElTZXR0aW5nLCBjb25maWd1cmF0aW9uTW9kaWZ5OiBJQ29uZmlndXJhdGlvbk1vZGlmeSwgcmVhZDogSVJlYWQsIGh0dHA6IElIdHRwKTogUHJvbWlzZTx2b2lkPiB7fVxuXG4gICAgLyoqXG4gICAgICogTWV0aG9kIHdoaWNoIGlzIGNhbGxlZCBiZWZvcmUgYSBzZXR0aW5nIHdoaWNoIGJlbG9uZ3MgdG8gdGhpcyBBcHAgaXMgZ29pbmcgdG8gYmUgdXBkYXRlZFxuICAgICAqIGJ5IGFuIGV4dGVybmFsIHN5c3RlbSBhbmQgbm90IHRoaXMgQXBwIGl0c2VsZi4gVGhlIHNldHRpbmcgcGFzc2VkIGlzIHRoZSBuZXdseSB1cGRhdGVkIG9uZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzZXR0aW5nIHRoZSBzZXR0aW5nIHdoaWNoIGlzIGdvaW5nIHRvIGJlIHVwZGF0ZWRcbiAgICAgKiBAcGFyYW0gY29uZmlndXJhdGlvbk1vZGlmeSB0aGUgYWNjZXNzb3IgdG8gbW9kaWZpeSB0aGUgc3lzdGVtXG4gICAgICogQHBhcmFtIHJlYWRlciB0aGUgcmVhZGVyIGFjY2Vzc29yXG4gICAgICogQHBhcmFtIGh0dHAgYW4gYWNjZXNzb3IgdG8gdGhlIG91dHNpZGUgd29ybGRcbiAgICAgKi9cbiAgICBwdWJsaWMgYXN5bmMgb25QcmVTZXR0aW5nVXBkYXRlKGNvbnRleHQ6IElTZXR0aW5nVXBkYXRlQ29udGV4dCwgY29uZmlndXJhdGlvbk1vZGlmeTogSUNvbmZpZ3VyYXRpb25Nb2RpZnksIHJlYWQ6IElSZWFkLCBodHRwOiBJSHR0cCk6IFByb21pc2U8SVNldHRpbmc+IHtcbiAgICAgICAgcmV0dXJuIGNvbnRleHQubmV3U2V0dGluZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNZXRob2Qgd2lsbCBiZSBjYWxsZWQgZHVyaW5nIGluaXRpYWxpemF0aW9uLiBJdCBhbGxvd3MgZm9yIGFkZGluZyBjdXN0b20gY29uZmlndXJhdGlvbiBvcHRpb25zIGFuZCBkZWZhdWx0c1xuICAgICAqIEBwYXJhbSBjb25maWd1cmF0aW9uXG4gICAgICovXG4gICAgcHJvdGVjdGVkIGFzeW5jIGV4dGVuZENvbmZpZ3VyYXRpb24oY29uZmlndXJhdGlvbjogSUNvbmZpZ3VyYXRpb25FeHRlbmQsIGVudmlyb25tZW50UmVhZDogSUVudmlyb25tZW50UmVhZCk6IFByb21pc2U8dm9pZD4ge31cblxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIHN0YXR1cyB0aGlzIEFwcCBpcyBub3cgYXQsIHVzZSBvbmx5IHdoZW4gMTAwJSB0cnVlIChpdCdzIHByb3RlY3RlZCBmb3IgYSByZWFzb24pLlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0YXR1cyB0aGUgbmV3IHN0YXR1cyBvZiB0aGlzIEFwcFxuICAgICAqL1xuICAgIHByb3RlY3RlZCBhc3luYyBzZXRTdGF0dXMoc3RhdHVzOiBBcHBTdGF0dXMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZGVidWcoYFRoZSBzdGF0dXMgaXMgbm93OiAke3N0YXR1c31gKTtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSBzdGF0dXM7XG4gICAgfVxuXG4gICAgLy8gQXZvaWQgbGVha2luZyByZWZlcmVuY2VzIGlmIG9iamVjdCBpcyBzZXJpYWxpemVkIChlLmcuIHRvIGJlIHNlbnQgb3ZlciBJUEMpXG4gICAgcHVibGljIHRvSlNPTigpOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mbztcbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxTQUFTLFFBQVEsY0FBYztBQXFCeEMsT0FBTyxNQUFlOzs7O0VBQ1YsT0FBc0M7RUFFOUM7Ozs7O0tBS0MsR0FDRCxZQUNJLEFBQWlCLElBQWMsRUFDL0IsQUFBaUIsTUFBZSxFQUNoQyxBQUFpQixTQUF5QixDQUM1QztTQUhtQixPQUFBO1NBQ0EsU0FBQTtTQUNBLFlBQUE7U0FYYixTQUFvQixVQUFVLE9BQU87SUFhekMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQ2IsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFB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