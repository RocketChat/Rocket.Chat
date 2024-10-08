import type { AppStatus } from '../../../src/definition/AppStatus';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import { AppActivationBridge } from '../../../src/server/bridges';

export class TestsActivationBridge extends AppActivationBridge {
    public async appAdded(app: ProxiedApp): Promise<void> {
        console.log(`The App ${app.getName()} (${app.getID()}) has been added.`);
    }

    public async appUpdated(app: ProxiedApp): Promise<void> {
        console.log(`The App ${app.getName()} (${app.getID()}) has been updated.`);
    }

    public async appRemoved(app: ProxiedApp): Promise<void> {
        console.log(`The App ${app.getName()} (${app.getID()}) has been removed.`);
    }

    public async appStatusChanged(app: ProxiedApp, status: AppStatus): Promise<void> {
        console.log(`The App ${app.getName()} (${app.getID()}) status has changed to: ${status}`);
    }

    protected async actionsChanged(): Promise<void> {
        console.log('The actions have changed.');
    }
}
