/** An emoji shortcode, colons included, as `:thumbsup:`. */
export type Reaction = `:${string}:`;

/**
 * Interface which represents a reaction which can be added to a message.
 */
// Note: keeping it as string for compatibility
export interface IMessageReactions {
	[emoji: string]: Array<IMessageReaction>;
}

/** Who reacted with one emoji. */
export interface IMessageReaction {
	/** The usernames of everyone who reacted with it. */
	usernames?: Array<string>;
}
