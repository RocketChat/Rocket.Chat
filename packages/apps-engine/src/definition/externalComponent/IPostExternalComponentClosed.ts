import type { IHttp, IPersistence, IRead } from '../accessors';
import type { IExternalComponent } from './IExternalComponent';

/**
 * Handler called after an external component is closed.
 */
export interface IPostExternalComponentClosed {
    /**
     * Method called after an external component is closed.
     *
     * @param externalComponent The external component which was closed
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     */
    executePostExternalComponentClosed(externalComponent: IExternalComponent, read: IRead, http: IHttp, persistence: IPersistence): Promise<void>;
}
