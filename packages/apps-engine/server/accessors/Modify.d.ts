import type { IModify, IModifyCreator, IModifyDeleter, IModifyExtender, IModifyUpdater, INotifier, ISchedulerModify, IUIController } from '../../definition/accessors';
import type { IOAuthAppsModify } from '../../definition/accessors/IOAuthAppsModify';
import type { AppBridges } from '../bridges';
import { ModerationModify } from './ModerationModify';
export declare class Modify implements IModify {
    private readonly bridges;
    private readonly appId;
    private creator;
    private deleter;
    private updater;
    private extender;
    private notifier;
    private uiController;
    private scheduler;
    private oauthApps;
    private moderation;
    constructor(bridges: AppBridges, appId: string);
    getCreator(): IModifyCreator;
    getDeleter(): IModifyDeleter;
    getUpdater(): IModifyUpdater;
    getExtender(): IModifyExtender;
    getNotifier(): INotifier;
    getUiController(): IUIController;
    getScheduler(): ISchedulerModify;
    getOAuthAppsModifier(): IOAuthAppsModify;
    getModerationModifier(): ModerationModify;
}
