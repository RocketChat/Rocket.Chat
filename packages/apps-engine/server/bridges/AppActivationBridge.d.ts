import type { AppStatus } from '../../definition/AppStatus';
import type { ProxiedApp } from '../ProxiedApp';
import { BaseBridge } from './BaseBridge';
export declare abstract class AppActivationBridge extends BaseBridge {
    doAppAdded(app: ProxiedApp): Promise<void>;
    doAppUpdated(app: ProxiedApp): Promise<void>;
    doAppRemoved(app: ProxiedApp): Promise<void>;
    doAppStatusChanged(app: ProxiedApp, status: AppStatus): Promise<void>;
    doActionsChanged(): Promise<void>;
    protected abstract appAdded(app: ProxiedApp): Promise<void>;
    protected abstract appUpdated(app: ProxiedApp): Promise<void>;
    protected abstract appRemoved(app: ProxiedApp): Promise<void>;
    protected abstract appStatusChanged(app: ProxiedApp, status: AppStatus): Promise<void>;
    protected abstract actionsChanged(): Promise<void>;
}
