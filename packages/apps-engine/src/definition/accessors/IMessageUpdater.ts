import type { Reaction } from '../messages';

export interface IMessageUpdater {
    /**
     * Add a reaction to a message
     *
     * @param messageId the id of the message
     * @param userId the id of the user
     * @param reaction the reaction
     */
    addReaction(messageId: string, userId: string, reaction: Reaction): Promise<void>;

    /**
     * Remove a reaction from a message
     *
     * @param messageId the id of the message
     * @param userId the id of the user
     * @param reaction the reaction
     */
    removeReaction(messageId: string, userId: string, reaction: Reaction): Promise<void>;
}
