import type { IVisitor } from '../../livechat';
import type { IMessage } from '../../messages';
import type { IRoom } from '../../rooms';
import type { UIKitIncomingInteractionType } from '../IUIKitIncomingInteraction';
import type {
	IUIKitIncomingInteractionMessageContainer,
	IUIKitIncomingInteractionModalContainer,
} from '../UIKitIncomingInteractionContainer';

/** An interaction from the Livechat widget, as the host sends it to an App. */
export interface IUIKitLivechatIncomingInteraction {
	/** What the visitor did. */
	type: UIKitIncomingInteractionType;
	/** Where the blocks were rendered. */
	container: IUIKitIncomingInteractionModalContainer | IUIKitIncomingInteractionMessageContainer;
	/** The visitor who acted. */
	visitor: IVisitor;
	/** The App the interaction is for. */
	appId: string;
	/** What the widget sent along with the action. */
	payload: object;
	/** The action id of the element the visitor acted on. */
	actionId?: string;
	/** The token that lets the App answer with a surface. It expires. */
	triggerId?: string;
	/** The conversation the visitor was in. */
	room?: IRoom;
	/** The message the blocks were attached to, when they were. */
	message?: IMessage;
}
