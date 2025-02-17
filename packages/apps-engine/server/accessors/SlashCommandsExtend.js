"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlashCommandsExtend = void 0;
class SlashCommandsExtend {
    constructor(manager, appId) {
        this.manager = manager;
        this.appId = appId;
    }
    provideSlashCommand(slashCommand) {
        return Promise.resolve(this.manager.addCommand(this.appId, slashCommand));
    }
}
exports.SlashCommandsExtend = SlashCommandsExtend;
//# sourceMappingURL=SlashCommandsExtend.js.map