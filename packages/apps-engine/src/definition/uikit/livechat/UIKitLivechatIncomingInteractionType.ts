import type { IVisitor } from '../../livechat';
import type { IMessage } from '../../messages';
import type { IRoom } from '../../rooms';
import type {
	IUIKitIncomingInteractionMessageContainer,
	IUIKitIncomingInteractionModalContainer,
} from '../UIKitIncomingInteractionContainer';

/**
 * What every UIKit interaction from the Livechat widget carries.
 *
 * It mirrors `IUIKitBaseIncomingInteraction`, except that a visitor acted
 * rather than a user.
 */
export interface IUIKitLivechatBaseIncomingInteraction {
	/** The App the interaction is for. */
	appId: string;
	/** The visitor who acted. */
	visitor: IVisitor;
	/** The action id of the element the visitor acted on. */
	actionId?: string;
	/** The conversation the visitor was in. */
	room?: IRoom;
	/** The token that lets the App answer with a surface. It expires. */
	triggerId?: string;
}

/** A visitor acted on a block element in the Livechat widget. */
export interface IUIKitLivechatBlockIncomingInteraction extends IUIKitLivechatBaseIncomingInteraction {
	/** What the element now holds: the option picked, or the text typed. */
	value?: string;
	/** The message the blocks were attached to, when they were. */
	message?: IMessage;
	triggerId: string;
	actionId: string;
	/** The block the element belongs to. */
	blockId: string;
	room: IUIKitLivechatBaseIncomingInteraction['room'];
	/** Where the blocks were rendered. */
	container: IUIKitIncomingInteractionModalContainer | IUIKitIncomingInteractionMessageContainer;
}
