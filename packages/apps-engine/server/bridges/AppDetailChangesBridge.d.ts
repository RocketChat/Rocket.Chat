import { BaseBridge } from './BaseBridge';
import type { ISetting } from '../../definition/settings';
/**
 * An abstract class which will contain various methods related to Apps
 * which are called for various inner detail working changes. This
 * allows for us to notify various external components of internal
 * changes.
 */
export declare abstract class AppDetailChangesBridge extends BaseBridge {
    doOnAppSettingsChange(appId: string, setting: ISetting): void;
    protected abstract onAppSettingsChange(appId: string, setting: ISetting): void;
}
