import type { IMessage } from '../messages';
import type { IRoom } from '../rooms';
import type { IUser } from '../users';
import type { IUIKitIncomingInteractionActionButton } from './IUIKitIncomingInteractionActionButton';
import type { IUIKitSurface } from './IUIKitSurface';
import type {
	IUIKitIncomingInteractionMessageContainer,
	IUIKitIncomingInteractionModalContainer,
} from './UIKitIncomingInteractionContainer';

export enum UIKitIncomingInteractionType {
	BLOCK = 'blockAction',
	BLOCK_SUGGESTION = 'blockSuggestion',
	VIEW_SUBMIT = 'viewSubmit',
	VIEW_CLOSED = 'viewClosed',
	ACTION_BUTTON = 'actionButton',
	APP_HOME_OPENED = 'appHomeOpened',
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

export interface IUIKitIncomingInteractionAppHomeOpened {
	type: 'appHomeOpened';
	user: IUser;
	appId: string;
	triggerId: string;
	actionId?: undefined;
	payload: { view?: IUIKitSurface };
}

/** Sent while the user types in an external select, to ask the app for options. */
export interface IUIKitIncomingInteractionBlockSuggestion {
	type: 'blockSuggestion';
	appId: string;
	user: IUser;
	actionId: string;
	blockId: string;
	value: string;
	container: IUIKitIncomingInteractionModalContainer | IUIKitIncomingInteractionMessageContainer;
	triggerId?: string;
	room?: IRoom;
	message?: IMessage;
}

export type UIKitIncomingInteraction =
	| IUIKitIncomingInteraction
	| IUIKitIncomingInteractionActionButton
	| IUIKitIncomingInteractionAppHomeOpened
	| IUIKitIncomingInteractionBlockSuggestion;
