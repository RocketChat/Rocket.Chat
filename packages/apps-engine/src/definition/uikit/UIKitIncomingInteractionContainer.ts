/** What a user was looking at when they acted on a block. */
export enum UIKitIncomingInteractionContainerType {
	/** The blocks were attached to a message in a room. */
	MESSAGE = 'message',
	/** The blocks were on a surface the App opened. */
	VIEW = 'view',
}

/**
 * Where the block the user acted on was rendered.
 *
 * Use it to tell an action taken on a message apart from the same action taken
 * on a surface.
 */
export interface IUIKitIncomingInteractionContainer {
	/** Which kind of container it was. */
	type: UIKitIncomingInteractionContainerType;
	/** The id of the message or the surface. */
	id: string;
}
/** The block was on a modal. */
export interface IUIKitIncomingInteractionModalContainer extends IUIKitIncomingInteractionContainer {
	type: UIKitIncomingInteractionContainerType.VIEW;
}
/** The block was on a contextual bar. */
export interface IUIKitIncomingInteractionContextualBarContainer extends IUIKitIncomingInteractionContainer {
	type: UIKitIncomingInteractionContainerType.VIEW;
}
/** The block was attached to a message. */
export interface IUIKitIncomingInteractionMessageContainer extends IUIKitIncomingInteractionContainer {
	type: UIKitIncomingInteractionContainerType.MESSAGE;
}
