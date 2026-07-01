import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type {
	IUIKitIncomingInteractionMessageContainer,
	IUIKitIncomingInteractionModalContainer,
} from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import type { UIKitIncomingInteractionActionButton } from './UIKitIncomingInteractionActionButton';

export enum UIKitIncomingInteractionType {
	BLOCK = 'blockAction',
	VIEW_SUBMIT = 'viewSubmit',
	VIEW_CLOSED = 'viewClosed',
	ACTION_BUTTON = 'actionButton',
}

/** @deprecated use UIKitIncomingInteraction instead */

export interface IUIKitIncomingInteraction {
	type: 'blockAction' | 'viewSubmit' | 'viewClosed';
	container: IUIKitIncomingInteractionModalContainer | IUIKitIncomingInteractionMessageContainer;
	user: IUser;
	appId: string;
	payload: object;
	actionId?: string;
	triggerId?: string;
	room?: IRoom;
	message?: IMessage;
}

export type UIKitIncomingInteraction = IUIKitIncomingInteraction | UIKitIncomingInteractionActionButton;
