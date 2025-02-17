import type { IRoom } from '../rooms';
import type { IUser } from '../users';
/**
 * Represents  the slash command's context when a user
 * executes a slash command.
 */
export declare class SlashCommandContext {
    private sender;
    private room;
    private params;
    private threadId?;
    private triggerId?;
    constructor(sender: IUser, room: IRoom, params: Array<string>, threadId?: string, triggerId?: string);
    /** The user who sent the command. */
    getSender(): IUser;
    /** The room where the command was sent in. */
    getRoom(): IRoom;
    /** The arguments passed into the command. */
    getArguments(): Array<string>;
    getThreadId(): string | undefined;
    getTriggerId(): string | undefined;
}
