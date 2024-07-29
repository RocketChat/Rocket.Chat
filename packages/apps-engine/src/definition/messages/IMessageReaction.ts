/**
 * Interface which represents a reaction which can be added to a message.
 */
export interface IMessageReactions {
    [emoji: string]: Array<IMessageReaction>;
}

export interface IMessageReaction {
    usernames?: Array<string>;
}
