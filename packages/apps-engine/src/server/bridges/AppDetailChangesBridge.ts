import type { ISetting } from '../../definition/settings';
import { BaseBridge } from './BaseBridge';

/**
 * An abstract class which will contain various methods related to Apps
 * which are called for various inner detail working changes. This
 * allows for us to notify various external components of internal
 * changes.
 */
export abstract class AppDetailChangesBridge extends BaseBridge {
    public doOnAppSettingsChange(appId: string, setting: ISetting): void {
        return this.onAppSettingsChange(appId, setting);
    }

    protected abstract onAppSettingsChange(appId: string, setting: ISetting): void;
}
