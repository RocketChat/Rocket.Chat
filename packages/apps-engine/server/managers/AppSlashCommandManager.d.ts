import type { ISlashCommand, ISlashCommandPreview, ISlashCommandPreviewItem } from '../../definition/slashcommands';
import { SlashCommandContext } from '../../definition/slashcommands';
import type { AppManager } from '../AppManager';
/**
 * The command manager for the Apps.
 *
 * An App will add commands during their `initialize` method.
 * Then once an App's `onEnable` is called and it returns true,
 * only then will that App's commands be enabled.
 *
 * Registered means the command has been provided to the bridged system.
 */
export declare class AppSlashCommandManager {
    private readonly manager;
    private readonly bridge;
    private readonly accessors;
    /**
     * Variable that contains the commands which have been provided by apps.
     * The key of the top map is app id and the key of the inner map is the command
     */
    private providedCommands;
    /**
     * Contains the commands which have modified the system commands
     */
    private modifiedCommands;
    /**
     * Contains the commands as keys and appId that touched it.
     * Doesn't matter whether the app provided, modified, disabled, or enabled.
     * As long as an app touched the command (besides to see if it exists), then it is listed here.
     */
    private touchedCommandsToApps;
    /**
     * Contains the apps and the commands they have touched. The key is the appId and value is the commands.
     * Doesn't matter whether the app provided, modified, disabled, or enabled.
     * As long as an app touched the command (besides to see if it exists), then it is listed here.
     */
    private appsTouchedCommands;
    constructor(manager: AppManager);
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
    canCommandBeTouchedBy(appId: string, command: string): boolean;
    /**
     * Determines whether the command is already provided by an App or not.
     * It is case insensitive.
     *
     * @param command the command to check if it exists or not
     * @returns whether or not it is already provided
     */
    isAlreadyDefined(command: string): boolean;
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
    addCommand(appId: string, command: ISlashCommand): Promise<void>;
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
    modifyCommand(appId: string, command: ISlashCommand): Promise<void>;
    /**
     * Goes and enables a command in the bridged system. The command
     * which is being enabled must either be the App's or a system
     * command which has yet to be touched by an App.
     *
     * @param appId the id of the app enabling the command
     * @param command the command which is being enabled
     */
    enableCommand(appId: string, command: string): Promise<void>;
    /**
     * Renders an existing slash command un-usable. Whether that command is provided
     * by the App calling this or a command provided by the bridged system, we don't care.
     * However, an App can not disable a command which has already been touched
     * by another App in some way.
     *
     * @param appId the app's id which is disabling the command
     * @param command the command to disable in the bridged system
     */
    disableCommand(appId: string, command: string): Promise<void>;
    /**
     * Registers all of the commands for the provided app inside
     * of the bridged system which then enables them.
     *
     * @param appId The app's id of which to register it's commands with the bridged system
     */
    registerCommands(appId: string): Promise<void>;
    /**
     * Unregisters the commands from the system and restores the commands
     * which the app modified in the system.
     *
     * @param appId the appId for the commands to purge
     */
    unregisterCommands(appId: string): Promise<void>;
    /**
     * Executes an App's command.
     *
     * @param command the command to execute
     * @param context the context in which the command was entered
     */
    executeCommand(command: string, context: SlashCommandContext): Promise<void>;
    getPreviews(command: string, context: SlashCommandContext): Promise<ISlashCommandPreview>;
    executePreview(command: string, previewItem: ISlashCommandPreviewItem, context: SlashCommandContext): Promise<void>;
    private ensureContext;
    /**
     * Determines if the command's functions should run,
     * this way the code isn't duplicated three times.
     *
     * @param command the lowercase and trimmed command
     * @returns whether or not to continue
     */
    private shouldCommandFunctionsRun;
    private retrieveCommandInfo;
    /**
     * Sets that an App has been touched.
     *
     * @param appId the app's id which has touched the command
     * @param command the command, lowercase and trimmed, which has been touched
     */
    private setAsTouched;
    /**
     * Actually goes and provide's the bridged system with the command information.
     *
     * @param appId the app which is providing the command
     * @param info the command's registration information
     */
    private registerCommand;
}
