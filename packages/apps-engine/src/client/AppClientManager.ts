import { AppServerCommunicator } from './AppServerCommunicator';
import { AppsEngineUIHost } from './AppsEngineUIHost';
import type { IAppInfo } from '../definition/metadata';

export class AppClientManager {
    private apps: Array<IAppInfo>;

    constructor(
        private readonly appsEngineUIHost: AppsEngineUIHost,
        private readonly communicator?: AppServerCommunicator,
    ) {
        if (!(appsEngineUIHost instanceof AppsEngineUIHost)) {
            throw new Error('The appClientUIHost must extend appClientUIHost');
        }

        if (communicator && !(communicator instanceof AppServerCommunicator)) {
            throw new Error('The communicator must extend AppServerCommunicator');
        }

        this.apps = [];
    }

    public async load(): Promise<void> {
        this.apps = await this.communicator.getEnabledApps();
        console.log('Enabled apps:', this.apps);
    }

    public async initialize(): Promise<void> {
        this.appsEngineUIHost.initialize();
    }
}
