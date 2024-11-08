import type { IHttp, IPersistence, IRead } from '../accessors';
import type { IExternalComponent } from './IExternalComponent';

/**
 * Handler called after an external component is opened.
 */
export interface IPostExternalComponentOpened {
    /**
     * Method called after an external component is opened.
     *
     * @param externalComponent The external component which was opened
     * @param read An accessor to the environment
     * @param http An accessor to the outside world
     */
    executePostExternalComponentOpened(externalComponent: IExternalComponent, read: IRead, http: IHttp, persistence: IPersistence): Promise<void>;
}
