import type { IMessage } from '../IMessage';
import type { IRoom } from '../IRoom';
import type { View } from './View';

export type MessageBlockActionUserInteraction = {
	type: 'blockAction';
	actionId: string;
	payload: {
		blockId: string;
		value: unknown;
	};
	container: {
		type: 'message';
		id: IMessage['_id'];
	};
	mid: IMessage['_id'];
	tmid?: IMessage['_id'];
	rid: IRoom['_id'];
	triggerId: string;
};

export type ViewBlockActionUserInteraction = {
	type: 'blockAction';
	actionId: string;
	payload: {
		blockId: string;
		value: unknown;
	};
	container: {
		type: 'view';
		id: string;
	};
	triggerId: string;
};

export type ViewClosedUserInteraction = {
	type: 'viewClosed';
	payload: {
		viewId: string;
		view: View & {
			id: string;
			state: { [blockId: string]: { [key: string]: unknown } };
		};
		isCleared?: boolean;
	};
	triggerId: string;
};

export type ViewSubmitUserInteraction = {
	type: 'viewSubmit';
	actionId?: undefined;
	payload: {
		view: View & {
			id: string;
			state: { [blockId: string]: { [key: string]: unknown } };
		};
	};
	triggerId: string;
	viewId: string;
};

export type MessageBoxActionButtonUserInteraction = {
	type: 'actionButton';
	actionId: string;
	payload: {
		context: 'messageBoxAction';
		message: string;
	};
	mid?: undefined;
	tmid?: IMessage['_id'];
	rid: IRoom['_id'];
	triggerId: string;
};

export type UserDropdownActionButtonUserInteraction = {
	type: 'actionButton';
	actionId: string;
	payload: {
		context: 'userDropdownAction';
		message?: undefined;
	};
	mid?: undefined;
	tmid?: undefined;
	rid?: undefined;
	triggerId: string;
};

export type MesssageActionButtonUserInteraction = {
	type: 'actionButton';
	actionId: string;
	payload: {
		context: 'messageAction';
		message?: undefined;
	};
	mid: IMessage['_id'];
	tmid?: IMessage['_id'];
	rid: IRoom['_id'];
	triggerId: string;
};

export type RoomActionButtonUserInteraction = {
	type: 'actionButton';
	actionId: string;
	payload: {
		context: 'roomAction';
		message?: undefined;
	};
	mid?: undefined;
	tmid?: undefined;
	rid: IRoom['_id'];
	triggerId: string;
};

export type UserInteraction =
	| MessageBlockActionUserInteraction
	| ViewBlockActionUserInteraction
	| ViewClosedUserInteraction
	| ViewSubmitUserInteraction
	| MessageBoxActionButtonUserInteraction
	| UserDropdownActionButtonUserInteraction
	| MesssageActionButtonUserInteraction
	| RoomActionButtonUserInteraction;
