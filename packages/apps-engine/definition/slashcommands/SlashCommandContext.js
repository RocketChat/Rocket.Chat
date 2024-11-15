"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlashCommandContext = void 0;
/**
 * Represents  the slash command's context when a user
 * executes a slash command.
 */
class SlashCommandContext {
    constructor(sender, room, params, threadId, triggerId) {
        this.sender = sender;
        this.room = room;
        this.params = params;
        this.threadId = threadId;
        this.triggerId = triggerId;
    }
    /** The user who sent the command. */
    getSender() {
        return this.sender;
    }
    /** The room where the command was sent in. */
    getRoom() {
        return this.room;
    }
    /** The arguments passed into the command. */
    getArguments() {
        return this.params;
    }
    getThreadId() {
        return this.threadId;
    }
    getTriggerId() {
        return this.triggerId;
    }
}
exports.SlashCommandContext = SlashCommandContext;
//# sourceMappingURL=SlashCommandContext.js.map