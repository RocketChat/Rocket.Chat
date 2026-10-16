/** An emoji shortcode, colons included, as `:thumbsup:`. */
export type Reaction = `:${string}:`;

/**
 * Every reaction on a message, keyed by emoji shortcode.
 *
 * The key stays a plain `string` rather than a {@link Reaction} so that
 * existing Apps keep compiling.
 */
export interface IMessageReactions {
	[emoji: string]: Array<IMessageReaction>;
}

/** Who reacted with one emoji. */
export interface IMessageReaction {
	/** The usernames of everyone who reacted with it. */
	usernames?: Array<string>;
}
