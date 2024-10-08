import type { ISlashCommand } from '../slashcommands';

/**
 * This accessor provides methods for modifying existing Rocket.Chat slash commands.
 * It is provided during "onEnable" of your App.
 */
export interface ISlashCommandsModify {
    /**
     * Modifies an existing command. The command must either be your App's
     * own command or a system command. One App can not modify another
     * App's command.
     *
     * @param slashCommand the modified slash command
     */
    modifySlashCommand(slashCommand: ISlashCommand): Promise<void>;

    /**
     * Renders an existing slash command un-usable.
     *
     * @param command the command's usage without the slash
     */
    disableSlashCommand(command: string): Promise<void>;

    /**
     * Enables an existing slash command to be usable again.
     *
     * @param command the command's usage without the slash
     */
    enableSlashCommand(command: string): Promise<void>;
}
