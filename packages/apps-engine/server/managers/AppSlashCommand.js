"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSlashCommand = void 0;
const metadata_1 = require("../../definition/metadata");
class AppSlashCommand {
    constructor(app, slashCommand) {
        this.app = app;
        this.slashCommand = slashCommand;
        this.isRegistered = false;
        this.isEnabled = false;
        this.isDisabled = false;
    }
    hasBeenRegistered() {
        this.isDisabled = false;
        this.isEnabled = true;
        this.isRegistered = true;
    }
    runExecutorOrPreviewer(method, context, logStorage, accessors) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.runTheCode(method, logStorage, accessors, context, []);
        });
    }
    runPreviewExecutor(previewItem, context, logStorage, accessors) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.runTheCode(metadata_1.AppMethod._COMMAND_PREVIEW_EXECUTOR, logStorage, accessors, context, [previewItem]);
        });
    }
    runTheCode(method, _logStorage, _accessors, context, runContextArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            const { command } = this.slashCommand;
            try {
                const result = yield this.app.getDenoRuntime().sendRequest({
                    method: `slashcommand:${command}:${method}`,
                    params: [...runContextArgs, context],
                });
                return result;
            }
            catch (e) {
                // @TODO this needs to be revisited
                console.error(e);
                throw e;
            }
        });
    }
}
exports.AppSlashCommand = AppSlashCommand;
//# sourceMappingURL=AppSlashCommand.js.map