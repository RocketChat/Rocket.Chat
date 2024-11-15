import { AppMethod } from '../../definition/metadata';
import type { ISlashCommand, ISlashCommandPreview, ISlashCommandPreviewItem, SlashCommandContext } from '../../definition/slashcommands';
import type { ProxiedApp } from '../ProxiedApp';
import type { AppLogStorage } from '../storage';
import type { AppAccessorManager } from './AppAccessorManager';
export declare class AppSlashCommand {
    app: ProxiedApp;
    slashCommand: ISlashCommand;
    /**
     * States whether this command has been registered into the Rocket.Chat system or not.
     */
    isRegistered: boolean;
    /**
     * Declares whether this command has been enabled or not,
     * does not have to be inside of the Rocket.Chat system if `isRegistered` is false.
     */
    isEnabled: boolean;
    /**
     * Proclaims whether this command has been disabled or not,
     * does not have to be inside the Rocket.Chat system if `isRegistered` is false.
     */
    isDisabled: boolean;
    constructor(app: ProxiedApp, slashCommand: ISlashCommand);
    hasBeenRegistered(): void;
    runExecutorOrPreviewer(method: AppMethod._COMMAND_EXECUTOR | AppMethod._COMMAND_PREVIEWER, context: SlashCommandContext, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<void | ISlashCommandPreview>;
    runPreviewExecutor(previewItem: ISlashCommandPreviewItem, context: SlashCommandContext, logStorage: AppLogStorage, accessors: AppAccessorManager): Promise<void>;
    private runTheCode;
}
