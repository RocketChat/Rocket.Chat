import type { IVisitor } from '../../livechat';
import type { IMessage } from '../../messages';
import type { IRoom } from '../../rooms';
import type { UIKitIncomingInteractionType } from '../IUIKitIncomingInteraction';
import type { IUIKitIncomingInteractionMessageContainer, IUIKitIncomingInteractionModalContainer } from '../UIKitIncomingInteractionContainer';

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
