import type { IExternalComponent } from '../../definition/externalComponent';
/**
 * The external component manager for the apps.
 *
 * An app will register external components during its `initialize` method.
 * Then once an app's `onEnable` method is called and it returns true,
 * only then will that app's external components be enabled.
 */
export declare class AppExternalComponentManager {
    /**
     * The map that maintains all registered components.
     * The key of the top map is app id and the key of inner map is the
     * external component name.
     */
    private registeredExternalComponents;
    /**
     * Contains the apps and the external components they have touhed.
     * The key of the top map is app id and the key of inner map is the
     * external component name.
     * Doesn't matter whether the app provided, modified, disabled,
     * or enabled. As long as an app touched external components, then
     * they are listed here.
     */
    private appTouchedExternalComponents;
    constructor();
    /**
     * Get all registered components.
     */
    getRegisteredExternalComponents(): Map<string, Map<string, IExternalComponent>>;
    /**
     * Get all external components that apps have registered
     * before, including disabled apps' external components.
     */
    getAppTouchedExternalComponents(): Map<string, Map<string, IExternalComponent>>;
    /**
     * Get all external components of an app by specifying the appId.
     *
     * @param appId the id of the app
     */
    getExternalComponents(appId: string): Map<string, IExternalComponent>;
    /**
     * Get an array of external components which are enabled and ready for usage.
     */
    getProvidedComponents(): Array<IExternalComponent>;
    /**
     * Add an external component to the appTouchedExternalComponents.
     * If you call this method twice and the component
     * has the same name as before, the first one will be
     * overwritten as the names provided **must** be unique.
     *
     * @param appId the id of the app
     * @param externalComponent the external component about to be added
     */
    addExternalComponent(appId: string, externalComponent: IExternalComponent): void;
    /**
     * Add enabled apps' external components from the appTouchedExternalComponents
     * to the registeredExternalComponents.
     *
     * @param appId the id of the app
     */
    registerExternalComponents(appId: string): void;
    /**
     * Remove all external components of an app from the
     * registeredExternalComponents by specifying the appId.
     *
     * @param appId the id of the app
     */
    unregisterExternalComponents(appId: string): void;
    /**
     * Remove all external components of an app from both the
     * registeredExternalComponents and the appTouchedComponents
     * by specifying the appId.
     *
     * @param appId the id of the app
     */
    purgeExternalComponents(appId: string): void;
}
