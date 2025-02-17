"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlashCommandsModify = void 0;
class SlashCommandsModify {
    constructor(manager, appId) {
        this.manager = manager;
        this.appId = appId;
    }
    modifySlashCommand(slashCommand) {
        return Promise.resolve(this.manager.modifyCommand(this.appId, slashCommand));
    }
    disableSlashCommand(command) {
        return Promise.resolve(this.manager.disableCommand(this.appId, command));
    }
    enableSlashCommand(command) {
        return Promise.resolve(this.manager.enableCommand(this.appId, command));
    }
}
exports.SlashCommandsModify = SlashCommandsModify;
//# sourceMappingURL=SlashCommandsModify.js.map