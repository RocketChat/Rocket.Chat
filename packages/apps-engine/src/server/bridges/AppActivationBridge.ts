import type { AppStatus } from '../../definition/AppStatus';
import type { ProxiedApp } from '../ProxiedApp';
import { BaseBridge } from './BaseBridge';

export abstract class AppActivationBridge extends BaseBridge {
    public async doAppAdded(app: ProxiedApp): Promise<void> {
        return this.appAdded(app);
    }

    public async doAppUpdated(app: ProxiedApp): Promise<void> {
        return this.appUpdated(app);
    }

    public async doAppRemoved(app: ProxiedApp): Promise<void> {
        return this.appRemoved(app);
    }

    public async doAppStatusChanged(app: ProxiedApp, status: AppStatus): Promise<void> {
        return this.appStatusChanged(app, status);
    }

    public async doActionsChanged(): Promise<void> {
        return this.actionsChanged();
    }

    protected abstract appAdded(app: ProxiedApp): Promise<void>;

    protected abstract appUpdated(app: ProxiedApp): Promise<void>;

    protected abstract appRemoved(app: ProxiedApp): Promise<void>;

    protected abstract appStatusChanged(app: ProxiedApp, status: AppStatus): Promise<void>;

    protected abstract actionsChanged(): Promise<void>;
}
