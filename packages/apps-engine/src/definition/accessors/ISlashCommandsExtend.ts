import type { ISlashCommand } from '../slashcommands';

/**
 * This accessor provides methods for adding custom slash commands.
 * It is provided during the initialization of your App
 */

export interface ISlashCommandsExtend {
    /**
     * Adds a slash command which can be used during conversations lateron.
     * Should a command already exists an error will be thrown.
     *
     * @param slashCommand the command information
     */
    provideSlashCommand(slashCommand: ISlashCommand): Promise<void>;
}
