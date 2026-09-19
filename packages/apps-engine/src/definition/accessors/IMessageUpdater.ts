import type { Reaction } from '../messages';

/**
 * Changes one part of a message without rewriting the message itself.
 *
 * Reactions are stored apart from the message body, so these calls do not
 * collide with an edit of the text.
 */
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
