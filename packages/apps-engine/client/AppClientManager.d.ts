import { AppServerCommunicator } from './AppServerCommunicator';
import { AppsEngineUIHost } from './AppsEngineUIHost';
export declare class AppClientManager {
    private readonly appsEngineUIHost;
    private readonly communicator?;
    private apps;
    constructor(appsEngineUIHost: AppsEngineUIHost, communicator?: AppServerCommunicator);
    load(): Promise<void>;
    initialize(): Promise<void>;
}
