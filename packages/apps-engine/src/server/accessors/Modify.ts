import type {
    IModify,
    IModifyCreator,
    IModifyDeleter,
    IModifyExtender,
    IModifyUpdater,
    INotifier,
    ISchedulerModify,
    IUIController,
} from '../../definition/accessors';
import type { IOAuthAppsModify } from '../../definition/accessors/IOAuthAppsModify';
import type { AppBridges } from '../bridges';
import { ModerationModify } from './ModerationModify';
import { ModifyCreator } from './ModifyCreator';
import { ModifyDeleter } from './ModifyDeleter';
import { ModifyExtender } from './ModifyExtender';
import { ModifyUpdater } from './ModifyUpdater';
import { Notifier } from './Notifier';
import { OAuthAppsModify } from './OAuthAppsModify';
import { SchedulerModify } from './SchedulerModify';
import { UIController } from './UIController';

export class Modify implements IModify {
    private creator: IModifyCreator;

    private deleter: IModifyDeleter;

    private updater: IModifyUpdater;

    private extender: IModifyExtender;

    private notifier: INotifier;

    private uiController: IUIController;

    private scheduler: ISchedulerModify;

    private oauthApps: IOAuthAppsModify;

    private moderation: ModerationModify;

    constructor(private readonly bridges: AppBridges, private readonly appId: string) {
        this.creator = new ModifyCreator(this.bridges, this.appId);
        this.deleter = new ModifyDeleter(this.bridges, this.appId);
        this.updater = new ModifyUpdater(this.bridges, this.appId);
        this.extender = new ModifyExtender(this.bridges, this.appId);
        this.notifier = new Notifier(this.bridges.getUserBridge(), this.bridges.getMessageBridge(), this.appId);
        this.uiController = new UIController(this.appId, this.bridges);
        this.scheduler = new SchedulerModify(this.bridges.getSchedulerBridge(), this.appId);
        this.oauthApps = new OAuthAppsModify(this.bridges.getOAuthAppsBridge(), this.appId);
        this.moderation = new ModerationModify(this.bridges.getModerationBridge(), this.appId);
    }

    public getCreator(): IModifyCreator {
        return this.creator;
    }

    public getDeleter(): IModifyDeleter {
        return this.deleter;
    }

    public getUpdater(): IModifyUpdater {
        return this.updater;
    }

    public getExtender(): IModifyExtender {
        return this.extender;
    }

    public getNotifier(): INotifier {
        return this.notifier;
    }

    public getUiController(): IUIController {
        return this.uiController;
    }

    public getScheduler(): ISchedulerModify {
        return this.scheduler;
    }

    public getOAuthAppsModifier() {
        return this.oauthApps;
    }

    public getModerationModifier() {
        return this.moderation;
    }
}
