import type { IRoom } from '../rooms';
import type { IUser } from '../users';

/**
 * Represents  the slash command's context when a user
 * executes a slash command.
 */
export class SlashCommandContext {
    constructor(
        private sender: IUser,
        private room: IRoom,
        private params: Array<string>,
        private threadId?: string,
        private triggerId?: string,
    ) {}

    /** The user who sent the command. */
    public getSender(): IUser {
        return this.sender;
    }

    /** The room where the command was sent in. */
    public getRoom(): IRoom {
        return this.room;
    }

    /** The arguments passed into the command. */
    public getArguments(): Array<string> {
        return this.params;
    }

    public getThreadId(): string | undefined {
        return this.threadId;
    }

    public getTriggerId(): string | undefined {
        return this.triggerId;
    }
}
