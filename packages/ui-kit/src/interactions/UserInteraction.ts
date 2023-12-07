import typia from 'typia';

import type { View } from '../surfaces/View';

export type MessageBlockActionUserInteraction = {
	type: 'blockAction';
	actionId: string;
	payload: {
		blockId: string;
		value: unknown;
	};
	container: {
		type: 'message';
		id: string;
	};
	mid: string;
	tmid?: string;
	rid: string;
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
	tmid?: string;
	rid: string;
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
	mid: string;
	tmid?: string;
	rid: string;
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
	rid: string;
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

export const isMessageBlockActionUserInteraction = typia.createIs<MessageBlockActionUserInteraction>();
export const isViewBlockActionUserInteraction = typia.createIs<ViewBlockActionUserInteraction>();
export const isViewClosedUserInteraction = typia.createIs<ViewClosedUserInteraction>();
export const isViewSubmitUserInteraction = typia.createIs<ViewSubmitUserInteraction>();
export const isMessageBoxActionButtonUserInteraction = typia.createIs<MessageBoxActionButtonUserInteraction>();
export const isUserDropdownActionButtonUserInteraction = typia.createIs<UserDropdownActionButtonUserInteraction>();
export const isMesssageActionButtonUserInteraction = typia.createIs<MesssageActionButtonUserInteraction>();
export const isRoomActionButtonUserInteraction = typia.createIs<RoomActionButtonUserInteraction>();
