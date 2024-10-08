export type Reaction = `:${string}:`;

/**
 * Interface which represents a reaction which can be added to a message.
 */
// Note: keeping it as string for compatibility
export interface IMessageReactions {
    [emoji: string]: Array<IMessageReaction>;
}

export interface IMessageReaction {
    usernames?: Array<string>;
}
