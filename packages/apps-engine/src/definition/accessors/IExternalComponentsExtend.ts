import type { IExternalComponent } from '../externalComponent';

/**
 * This accessor provides a method for registering external
 * components. This is provided during the initialization of your App.
 */
export interface IExternalComponentsExtend {
    /**
     * Register an external component to the system.
     * If you call this method twice and the component
     * has the same name as before, the first one will be
     * overwritten as the names provided **must** be unique.
     *
     * @param externalComponent the external component to be registered
     */
    register(externalComponent: IExternalComponent): Promise<void>;
}
