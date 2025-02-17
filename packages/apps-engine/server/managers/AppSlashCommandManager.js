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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSlashCommandManager = void 0;
const AppStatus_1 = require("../../definition/AppStatus");
const metadata_1 = require("../../definition/metadata");
const slashcommands_1 = require("../../definition/slashcommands");
const errors_1 = require("../errors");
const AppSlashCommand_1 = require("./AppSlashCommand");
const Room_1 = require("../rooms/Room");
/**
 * The command manager for the Apps.
 *
 * An App will add commands during their `initialize` method.
 * Then once an App's `onEnable` is called and it returns true,
 * only then will that App's commands be enabled.
 *
 * Registered means the command has been provided to the bridged system.
 */
class AppSlashCommandManager {
    constructor(manager) {
        this.manager = manager;
        this.bridge = this.manager.getBridges().getCommandBridge();
        this.accessors = this.manager.getAccessorManager();
        this.touchedCommandsToApps = new Map();
        this.appsTouchedCommands = new Map();
        this.providedCommands = new Map();
        this.modifiedCommands = new Map();
    }
    /**
     * Checks whether an App can touch a command or not. There are only two ways an App can touch
     * a command:
     * 1. The command has yet to be touched
     * 2. The app has already touched the command
     *
     * When do we consider an App touching a command? Whenever it adds, modifies,
     * or removes one that it didn't provide.
     *
     * @param appId the app's id which to check for
     * @param command the command to check about
     * @returns whether or not the app can touch the command
     */
    canCommandBeTouchedBy(appId, command) {
        const cmd = command.toLowerCase().trim();
        return cmd && (!this.touchedCommandsToApps.has(cmd) || this.touchedCommandsToApps.get(cmd) === appId);
    }
    /**
     * Determines whether the command is already provided by an App or not.
     * It is case insensitive.
     *
     * @param command the command to check if it exists or not
     * @returns whether or not it is already provided
     */
    isAlreadyDefined(command) {
        const search = command.toLowerCase().trim();
        let exists = false;
        this.providedCommands.forEach((cmds) => {
            if (cmds.has(search)) {
                exists = true;
            }
        });
        return exists;
    }
    /**
     * Adds a command to *be* registered. This will *not register* it with the
     * bridged system yet as this is only called on an App's
     * `initialize` method and an App might not get enabled.
     * When adding a command, it can *not* already exist in the system
     * (to overwrite) and another App can *not* have already touched or provided it.
     * Apps are on a first come first serve basis for providing and modifying commands.
     *
     * @param appId the app's id which the command belongs to
     * @param command the command to add to the system
     */
    addCommand(appId, command) {
        return __awaiter(this, void 0, void 0, function* () {
            command.command = command.command.toLowerCase().trim();
            // Ensure the app can touch this command
            if (!this.canCommandBeTouchedBy(appId, command.command)) {
                throw new errors_1.CommandHasAlreadyBeenTouchedError(command.command);
            }
            // Verify the command doesn't exist already
            if ((yield this.bridge.doDoesCommandExist(command.command, appId)) || this.isAlreadyDefined(command.command)) {
                throw new errors_1.CommandAlreadyExistsError(command.command);
            }
            const app = this.manager.getOneById(appId);
            if (!app) {
                throw new Error('App must exist in order for a command to be added.');
            }
            if (!this.providedCommands.has(appId)) {
                this.providedCommands.set(appId, new Map());
            }
            this.providedCommands.get(appId).set(command.command, new AppSlashCommand_1.AppSlashCommand(app, command));
            // The app has now touched the command, so let's set it
            this.setAsTouched(appId, command.command);
        });
    }
    /**
     * Modifies an existing command. The command must either be the App's
     * own command or a system command. One App can not modify another
     * App's command. Apps are on a first come first serve basis as to whether
     * or not they can touch or provide a command. If App "A" first provides,
     * or overwrites, a command then App "B" can not touch that command.
     *
     * @param appId the app's id of the command to modify
     * @param command the modified command to replace the current one with
     */
    modifyCommand(appId, command) {
        return __awaiter(this, void 0, void 0, function* () {
            command.command = command.command.toLowerCase().trim();
            // Ensure the app can touch this command
            if (!this.canCommandBeTouchedBy(appId, command.command)) {
                throw new errors_1.CommandHasAlreadyBeenTouchedError(command.command);
            }
            const app = this.manager.getOneById(appId);
            if (!app) {
                throw new Error('App must exist in order to modify a command.');
            }
            const hasNotProvidedIt = !this.providedCommands.has(appId) || !this.providedCommands.get(appId).has(command.command);
            // They haven't provided (added) it and the bridged system doesn't have it, error out
            if (hasNotProvidedIt && !(yield this.bridge.doDoesCommandExist(command.command, appId))) {
                throw new Error('You must first register a command before you can modify it.');
            }
            if (hasNotProvidedIt) {
                yield this.bridge.doModifyCommand(command, appId);
                const regInfo = new AppSlashCommand_1.AppSlashCommand(app, command);
                regInfo.isDisabled = false;
                regInfo.isEnabled = true;
                regInfo.isRegistered = true;
                this.modifiedCommands.set(command.command, regInfo);
            }
            else {
                this.providedCommands.get(appId).get(command.command).slashCommand = command;
            }
            this.setAsTouched(appId, command.command);
        });
    }
    /**
     * Goes and enables a command in the bridged system. The command
     * which is being enabled must either be the App's or a system
     * command which has yet to be touched by an App.
     *
     * @param appId the id of the app enabling the command
     * @param command the command which is being enabled
     */
    enableCommand(appId, command) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = command.toLowerCase().trim();
            // Ensure the app can touch this command
            if (!this.canCommandBeTouchedBy(appId, cmd)) {
                throw new errors_1.CommandHasAlreadyBeenTouchedError(cmd);
            }
            // Handle if the App provided the command fist
            if (this.providedCommands.has(appId) && this.providedCommands.get(appId).has(cmd)) {
                const cmdInfo = this.providedCommands.get(appId).get(cmd);
                // A command marked as disabled can then be "enabled" but not be registered.
                // This happens when an App is not enabled and they change the status of
                // command based upon a setting they provide which a User can change.
                if (!cmdInfo.isRegistered) {
                    cmdInfo.isDisabled = false;
                    cmdInfo.isEnabled = true;
                }
                return;
            }
            if (!(yield this.bridge.doDoesCommandExist(cmd, appId))) {
                throw new Error(`The command "${cmd}" does not exist to enable.`);
            }
            yield this.bridge.doEnableCommand(cmd, appId);
            this.setAsTouched(appId, cmd);
        });
    }
    /**
     * Renders an existing slash command un-usable. Whether that command is provided
     * by the App calling this or a command provided by the bridged system, we don't care.
     * However, an App can not disable a command which has already been touched
     * by another App in some way.
     *
     * @param appId the app's id which is disabling the command
     * @param command the command to disable in the bridged system
     */
    disableCommand(appId, command) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = command.toLowerCase().trim();
            // Ensure the app can touch this command
            if (!this.canCommandBeTouchedBy(appId, cmd)) {
                throw new errors_1.CommandHasAlreadyBeenTouchedError(cmd);
            }
            // Handle if the App provided the command fist
            if (this.providedCommands.has(appId) && this.providedCommands.get(appId).has(cmd)) {
                const cmdInfo = this.providedCommands.get(appId).get(cmd);
                // A command marked as enabled can then be "disabled" but not yet be registered.
                // This happens when an App is not enabled and they change the status of
                // command based upon a setting they provide which a User can change.
                if (!cmdInfo.isRegistered) {
                    cmdInfo.isDisabled = true;
                    cmdInfo.isEnabled = false;
                }
                return;
            }
            if (!(yield this.bridge.doDoesCommandExist(cmd, appId))) {
                throw new Error(`The command "${cmd}" does not exist to disable.`);
            }
            yield this.bridge.doDisableCommand(cmd, appId);
            this.setAsTouched(appId, cmd);
        });
    }
    /**
     * Registers all of the commands for the provided app inside
     * of the bridged system which then enables them.
     *
     * @param appId The app's id of which to register it's commands with the bridged system
     */
    registerCommands(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            if (!this.providedCommands.has(appId)) {
                return;
            }
            const commands = this.providedCommands.get(appId);
            try {
                for (var _d = true, commands_1 = __asyncValues(commands), commands_1_1; commands_1_1 = yield commands_1.next(), _a = commands_1_1.done, !_a; _d = true) {
                    _c = commands_1_1.value;
                    _d = false;
                    const [, appSlashCommand] = _c;
                    if (appSlashCommand.isDisabled) {
                        continue;
                    }
                    yield this.registerCommand(appId, appSlashCommand);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = commands_1.return)) yield _b.call(commands_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    /**
     * Unregisters the commands from the system and restores the commands
     * which the app modified in the system.
     *
     * @param appId the appId for the commands to purge
     */
    unregisterCommands(appId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_2, _b, _c;
            if (this.providedCommands.has(appId)) {
                const commands = this.providedCommands.get(appId);
                try {
                    for (var _d = true, commands_2 = __asyncValues(commands), commands_2_1; commands_2_1 = yield commands_2.next(), _a = commands_2_1.done, !_a; _d = true) {
                        _c = commands_2_1.value;
                        _d = false;
                        const [, appSlashCommand] = _c;
                        const cmd = appSlashCommand.slashCommand.command;
                        yield this.bridge.doUnregisterCommand(cmd, appId);
                        this.touchedCommandsToApps.delete(cmd);
                        if (!this.appsTouchedCommands.has(appId)) {
                            continue;
                        }
                        const ind = this.appsTouchedCommands.get(appId).indexOf(cmd);
                        this.appsTouchedCommands.get(appId).splice(ind, 1);
                        appSlashCommand.isRegistered = true;
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = commands_2.return)) yield _b.call(commands_2);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                this.providedCommands.delete(appId);
            }
            if (this.appsTouchedCommands.has(appId)) {
                // The commands inside the appsTouchedCommands should now
                // only be the ones which the App has enabled, disabled, or modified.
                // We call restore to enable the commands provided by the bridged system
                // or unmodify the commands modified by the App
                this.appsTouchedCommands.get(appId).forEach((cmd) => {
                    // @NOTE this "restore" method isn't present in the bridge
                    // this.bridge.doRestoreCommand(cmd, appId);
                    this.modifiedCommands.get(cmd).isRegistered = false;
                    this.modifiedCommands.delete(cmd);
                    this.touchedCommandsToApps.delete(cmd);
                });
                this.appsTouchedCommands.delete(appId);
            }
        });
    }
    /**
     * Executes an App's command.
     *
     * @param command the command to execute
     * @param context the context in which the command was entered
     */
    executeCommand(command, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = command.toLowerCase().trim();
            if (!this.shouldCommandFunctionsRun(cmd)) {
                return;
            }
            const app = this.manager.getOneById(this.touchedCommandsToApps.get(cmd));
            if (!app || AppStatus_1.AppStatusUtils.isDisabled(yield app.getStatus())) {
                // Just in case someone decides to do something they shouldn't
                // let's ensure the app actually exists
                return;
            }
            const appCmd = this.retrieveCommandInfo(cmd, app.getID());
            yield appCmd.runExecutorOrPreviewer(metadata_1.AppMethod._COMMAND_EXECUTOR, this.ensureContext(context), this.manager.getLogStorage(), this.accessors);
        });
    }
    getPreviews(command, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = command.toLowerCase().trim();
            if (!this.shouldCommandFunctionsRun(cmd)) {
                return;
            }
            const app = this.manager.getOneById(this.touchedCommandsToApps.get(cmd));
            if (!app || AppStatus_1.AppStatusUtils.isDisabled(yield app.getStatus())) {
                // Just in case someone decides to do something they shouldn't
                // let's ensure the app actually exists
                return;
            }
            const appCmd = this.retrieveCommandInfo(cmd, app.getID());
            const result = yield appCmd.runExecutorOrPreviewer(metadata_1.AppMethod._COMMAND_PREVIEWER, this.ensureContext(context), this.manager.getLogStorage(), this.accessors);
            if (!result) {
                // Failed to get the preview, thus returning is fine
                return;
            }
            return result;
        });
    }
    executePreview(command, previewItem, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = command.toLowerCase().trim();
            if (!this.shouldCommandFunctionsRun(cmd)) {
                return;
            }
            const app = this.manager.getOneById(this.touchedCommandsToApps.get(cmd));
            if (!app || AppStatus_1.AppStatusUtils.isDisabled(yield app.getStatus())) {
                // Just in case someone decides to do something they shouldn't
                // let's ensure the app actually exists
                return;
            }
            const appCmd = this.retrieveCommandInfo(cmd, app.getID());
            yield appCmd.runPreviewExecutor(previewItem, this.ensureContext(context), this.manager.getLogStorage(), this.accessors);
        });
    }
    ensureContext(context) {
        // Due to the internal changes for the usernames property, we need to ensure the room
        // is a class and not just an interface
        let room;
        if (context.getRoom() instanceof Room_1.Room) {
            room = context.getRoom();
        }
        else {
            room = new Room_1.Room(context.getRoom(), this.manager);
        }
        return new slashcommands_1.SlashCommandContext(context.getSender(), room, context.getArguments(), context.getThreadId(), context.getTriggerId());
    }
    /**
     * Determines if the command's functions should run,
     * this way the code isn't duplicated three times.
     *
     * @param command the lowercase and trimmed command
     * @returns whether or not to continue
     */
    shouldCommandFunctionsRun(command) {
        // None of the Apps have touched the command to execute,
        // thus we don't care so exit out
        if (!this.touchedCommandsToApps.has(command)) {
            return false;
        }
        const appId = this.touchedCommandsToApps.get(command);
        const cmdInfo = this.retrieveCommandInfo(command, appId);
        // Should the command information really not exist
        // Or if the command hasn't been registered
        // Or the command is disabled on our side
        // then let's not execute it, as the App probably doesn't want it yet
        if (!cmdInfo || !cmdInfo.isRegistered || cmdInfo.isDisabled) {
            return false;
        }
        return true;
    }
    retrieveCommandInfo(command, appId) {
        return this.modifiedCommands.get(command) || this.providedCommands.get(appId).get(command);
    }
    /**
     * Sets that an App has been touched.
     *
     * @param appId the app's id which has touched the command
     * @param command the command, lowercase and trimmed, which has been touched
     */
    setAsTouched(appId, command) {
        if (!this.appsTouchedCommands.has(appId)) {
            this.appsTouchedCommands.set(appId, []);
        }
        if (!this.appsTouchedCommands.get(appId).includes(command)) {
            this.appsTouchedCommands.get(appId).push(command);
        }
        this.touchedCommandsToApps.set(command, appId);
    }
    /**
     * Actually goes and provide's the bridged system with the command information.
     *
     * @param appId the app which is providing the command
     * @param info the command's registration information
     */
    registerCommand(appId, info) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.bridge.doRegisterCommand(info.slashCommand, appId);
            info.hasBeenRegistered();
        });
    }
}
exports.AppSlashCommandManager = AppSlashCommandManager;
//# sourceMappingURL=AppSlashCommandManager.js.map