"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modify = void 0;
const ModerationModify_1 = require("./ModerationModify");
const ModifyCreator_1 = require("./ModifyCreator");
const ModifyDeleter_1 = require("./ModifyDeleter");
const ModifyExtender_1 = require("./ModifyExtender");
const ModifyUpdater_1 = require("./ModifyUpdater");
const Notifier_1 = require("./Notifier");
const OAuthAppsModify_1 = require("./OAuthAppsModify");
const SchedulerModify_1 = require("./SchedulerModify");
const UIController_1 = require("./UIController");
class Modify {
    constructor(bridges, appId) {
        this.bridges = bridges;
        this.appId = appId;
        this.creator = new ModifyCreator_1.ModifyCreator(this.bridges, this.appId);
        this.deleter = new ModifyDeleter_1.ModifyDeleter(this.bridges, this.appId);
        this.updater = new ModifyUpdater_1.ModifyUpdater(this.bridges, this.appId);
        this.extender = new ModifyExtender_1.ModifyExtender(this.bridges, this.appId);
        this.notifier = new Notifier_1.Notifier(this.bridges.getUserBridge(), this.bridges.getMessageBridge(), this.appId);
        this.uiController = new UIController_1.UIController(this.appId, this.bridges);
        this.scheduler = new SchedulerModify_1.SchedulerModify(this.bridges.getSchedulerBridge(), this.appId);
        this.oauthApps = new OAuthAppsModify_1.OAuthAppsModify(this.bridges.getOAuthAppsBridge(), this.appId);
        this.moderation = new ModerationModify_1.ModerationModify(this.bridges.getModerationBridge(), this.appId);
    }
    getCreator() {
        return this.creator;
    }
    getDeleter() {
        return this.deleter;
    }
    getUpdater() {
        return this.updater;
    }
    getExtender() {
        return this.extender;
    }
    getNotifier() {
        return this.notifier;
    }
    getUiController() {
        return this.uiController;
    }
    getScheduler() {
        return this.scheduler;
    }
    getOAuthAppsModifier() {
        return this.oauthApps;
    }
    getModerationModifier() {
        return this.moderation;
    }
}
exports.Modify = Modify;
//# sourceMappingURL=Modify.js.map