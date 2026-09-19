/** What Rocket.Chat does with an `IMessageAction`'s `msg` when the user presses it. */
export enum MessageProcessingType {
	/** Posts the text as the user, as though they had typed it. */
	SendMessage = 'sendMessage',
	/** Puts the text in the composer for the user to send. */
	RespondWithMessage = 'respondWithMessage',
}
