"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppExternalComponentManager = void 0;
/**
 * The external component manager for the apps.
 *
 * An app will register external components during its `initialize` method.
 * Then once an app's `onEnable` method is called and it returns true,
 * only then will that app's external components be enabled.
 */
class AppExternalComponentManager {
    constructor() {
        this.registeredExternalComponents = new Map();
        this.appTouchedExternalComponents = new Map();
    }
    /**
     * Get all registered components.
     */
    getRegisteredExternalComponents() {
        return this.registeredExternalComponents;
    }
    /**
     * Get all external components that apps have registered
     * before, including disabled apps' external components.
     */
    getAppTouchedExternalComponents() {
        return this.appTouchedExternalComponents;
    }
    /**
     * Get all external components of an app by specifying the appId.
     *
     * @param appId the id of the app
     */
    getExternalComponents(appId) {
        if (this.appTouchedExternalComponents.has(appId)) {
            return this.appTouchedExternalComponents.get(appId);
        }
        return null;
    }
    /**
     * Get an array of external components which are enabled and ready for usage.
     */
    getProvidedComponents() {
        const registeredExternalComponents = this.getRegisteredExternalComponents();
        const providedComponents = [];
        registeredExternalComponents.forEach((appExternalComponents) => {
            Array.from(appExternalComponents.values()).forEach((externalComponent) => {
                providedComponents.push(externalComponent);
            });
        });
        return providedComponents;
    }
    /**
     * Add an external component to the appTouchedExternalComponents.
     * If you call this method twice and the component
     * has the same name as before, the first one will be
     * overwritten as the names provided **must** be unique.
     *
     * @param appId the id of the app
     * @param externalComponent the external component about to be added
     */
    addExternalComponent(appId, externalComponent) {
        externalComponent.appId = appId;
        if (!this.appTouchedExternalComponents.get(appId)) {
            this.appTouchedExternalComponents.set(appId, new Map(Object.entries({ [externalComponent.name]: externalComponent })));
        }
        else {
            const appExternalComponents = this.appTouchedExternalComponents.get(appId);
            appExternalComponents.set(externalComponent.name, externalComponent);
        }
    }
    /**
     * Add enabled apps' external components from the appTouchedExternalComponents
     * to the registeredExternalComponents.
     *
     * @param appId the id of the app
     */
    registerExternalComponents(appId) {
        if (!this.appTouchedExternalComponents.has(appId)) {
            return;
        }
        const externalComponents = this.appTouchedExternalComponents.get(appId);
        if (externalComponents.size > 0) {
            this.registeredExternalComponents.set(appId, externalComponents);
        }
    }
    /**
     * Remove all external components of an app from the
     * registeredExternalComponents by specifying the appId.
     *
     * @param appId the id of the app
     */
    unregisterExternalComponents(appId) {
        if (this.registeredExternalComponents.has(appId)) {
            this.registeredExternalComponents.delete(appId);
        }
    }
    /**
     * Remove all external components of an app from both the
     * registeredExternalComponents and the appTouchedComponents
     * by specifying the appId.
     *
     * @param appId the id of the app
     */
    purgeExternalComponents(appId) {
        if (this.appTouchedExternalComponents.has(appId)) {
            this.appTouchedExternalComponents.delete(appId);
        }
        if (this.registeredExternalComponents.has(appId)) {
            this.registeredExternalComponents.delete(appId);
        }
    }
}
exports.AppExternalComponentManager = AppExternalComponentManager;
//# sourceMappingURL=AppExternalComponentManager.js.map