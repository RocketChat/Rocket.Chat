import type { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type {
	IUIKitIncomingInteractionMessageContainer,
	IUIKitIncomingInteractionModalContainer,
} from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';

import type { UIKitIncomingInteractionType } from '../IUIKitIncomingInteraction';

export interface IUIKitLivechatIncomingInteraction {
	type: UIKitIncomingInteractionType;
	container: IUIKitIncomingInteractionModalContainer | IUIKitIncomingInteractionMessageContainer;
	visitor: IVisitor;
	appId: string;
	payload: object;
	actionId?: string;
	triggerId?: string;
	room?: IRoom;
	message?: IMessage;
}
