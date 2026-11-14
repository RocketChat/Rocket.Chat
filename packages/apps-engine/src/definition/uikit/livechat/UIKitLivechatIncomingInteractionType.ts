import type { IVisitor } from '../../livechat';
import type { IMessage } from '../../messages';
import type { IRoom } from '../../rooms';
import type { IUIKitSurface } from '../IUIKitSurface';
import type {
	IUIKitIncomingInteractionMessageContainer,
	IUIKitIncomingInteractionModalContainer,
} from '../UIKitIncomingInteractionContainer';

export interface IUIKitLivechatBaseIncomingInteraction {
	appId: string;
	visitor: IVisitor;
	actionId?: string;
	room?: IRoom;
	triggerId?: string;
}

export interface IUIKitLivechatBlockIncomingInteraction extends IUIKitLivechatBaseIncomingInteraction {
	value?: string;
	message?: IMessage;
	triggerId: string;
	actionId: string;
	blockId: string;
	room: IUIKitLivechatBaseIncomingInteraction['room'];
	container: IUIKitIncomingInteractionModalContainer | IUIKitIncomingInteractionMessageContainer;
}

export interface IUIKitLivechatViewSubmitIncomingInteraction extends IUIKitLivechatBaseIncomingInteraction {
	view: IUIKitSurface;
	triggerId: string;
}

export interface IUIKitLivechatViewCloseIncomingInteraction extends IUIKitLivechatBaseIncomingInteraction {
	view: IUIKitSurface;
	isCleared: boolean;
}
