import type { IMessage } from '../messages';
import type { IRoom } from '../rooms';
import { UIActionButtonContext } from '../ui';
import type { IUser } from '../users';
import type { IUIKitSurface } from './IUIKitSurface';
import type {
	IUIKitIncomingInteractionContextualBarContainer,
	IUIKitIncomingInteractionMessageContainer,
	IUIKitIncomingInteractionModalContainer,
} from './UIKitIncomingInteractionContainer';

/** What every UIKit interaction carries, whatever the user did. */
export interface IUIKitBaseIncomingInteraction {
	/** The App the interaction is for. */
	appId: string;
	/** The user who acted. */
	user: IUser;
	/** The action id of the element the user acted on. */
	actionId?: string;
	/** The room the user was in, when they were in one. */
	room?: IRoom;
	/** The token that lets the App answer with a surface. It expires. */
	triggerId?: string;
	/** The thread the user was reading, when they were in one. */
	threadId?: string;
}

/** A user acted on a block element. */
export interface IUIKitBlockIncomingInteraction extends IUIKitBaseIncomingInteraction {
	/** What the element now holds: the option picked, or the text typed. */
	value?: string;
	/** The message the blocks were attached to, when they were. */
	message?: IMessage;
	triggerId: string;
	actionId: string;
	/** The block the element belongs to. */
	blockId: string;
	room: IUIKitBaseIncomingInteraction['room'];
	/** Where the blocks were rendered. */
	container:
		| IUIKitIncomingInteractionModalContainer
		| IUIKitIncomingInteractionContextualBarContainer
		| IUIKitIncomingInteractionMessageContainer;
}

/**
 * A user submitted a surface.
 *
 * What they typed is in `view.state`, keyed by each input's block and action
 * id.
 */
export interface IUIKitViewSubmitIncomingInteraction extends IUIKitBaseIncomingInteraction {
	/** The surface as submitted, its state included. */
	view: IUIKitSurface;
	triggerId: string;
}

/** A user dismissed a surface that was opened with `notifyOnClose`. */
export interface IUIKitViewCloseIncomingInteraction extends IUIKitBaseIncomingInteraction {
	/** The surface as it stood when it was dismissed. */
	view: IUIKitSurface;
	/** Whether what the user typed was discarded, per the surface's `clearOnClose`. */
	isCleared: boolean;
}

/**
 * A user pressed one of the App's action buttons.
 *
 * {@link IUIKitActionButtonIncomingInteraction.buttonContext} says which
 * surface it came from, and with it which of the optional fields are filled
 * in.
 */
export interface IUIKitActionButtonIncomingInteraction extends IUIKitBaseIncomingInteraction {
	/** Where the button the user pressed was placed. */
	buttonContext: UIActionButtonContext;
	actionId: string;
	triggerId: string;
	room: IRoom;
	/** The message the button was on, for a button on a message. */
	message?: IMessage;
	threadId?: string;
}

/** A user pressed an action button in the message composer. */
export interface IUIKitActionButtonMessageBoxIncomingInteraction extends IUIKitActionButtonIncomingInteraction {
	buttonContext: UIActionButtonContext.MESSAGE_BOX_ACTION;
	/** What the user had already typed into the composer. */
	text?: string;
	threadId?: string;
}

/** Narrows an action button interaction to one from the message composer, which carries the composer's text. */
export function isMessageBoxIncomingInteraction(
	interaction: IUIKitActionButtonIncomingInteraction,
): interaction is IUIKitActionButtonMessageBoxIncomingInteraction {
	return interaction.buttonContext === UIActionButtonContext.MESSAGE_BOX_ACTION;
}
