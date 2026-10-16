import type { IMessage } from '../messages';
import type { IRoom } from '../rooms';
import type { IUser } from '../users';
import type { IUIKitIncomingInteractionActionButton } from './IUIKitIncomingInteractionActionButton';
import type {
	IUIKitIncomingInteractionMessageContainer,
	IUIKitIncomingInteractionModalContainer,
} from './UIKitIncomingInteractionContainer';

/** What a user did with an App's UIKit blocks. */
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

/** Any interaction the host sends an App, narrowed by its `type`. */
export type UIKitIncomingInteraction = IUIKitIncomingInteraction | IUIKitIncomingInteractionActionButton;
