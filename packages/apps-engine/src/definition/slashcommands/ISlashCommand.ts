import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import type { ISlashCommandPreview, ISlashCommandPreviewItem } from './ISlashCommandPreview';
import type { SlashCommandContext } from './SlashCommandContext';

/**
 * Represents a slash command that is being provided.
 */
export interface ISlashCommand {
    /** The value which determines what the user types. */
    command: string;
    /** Example of the parameters or an i18n string. */
    i18nParamsExample: string;
    /** i18n string for the description of the command. */
    i18nDescription: string;
    /** Optional. Permission value required for the user to have to see/use it. */
    permission?: string;
    /** Lets the clients know that this command does provide preview results. */
    providesPreview: boolean;
    /**
     * The function which gets called when a user enters the command.
     *
     * *Note*: This will not get called if a preview is defined and
     * presented to the user and the user interacts with the preview.
     * When that happens, the `executePreviewItem` function will be called.
     */
    executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void>;
    /**
     * The function which gets called whenever a user starts typing the command and the `providesPreview` is set to true.
     * Max amount returned to the client is 10 and no more, period.
     */
    previewer?(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<ISlashCommandPreview>;
    /** The function which gets executed whenever a user selects a preview item. */
    executePreviewItem?(
        item: ISlashCommandPreviewItem,
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<void>;
}
