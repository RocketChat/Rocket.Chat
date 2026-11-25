import typia from 'typia';

import type { Option } from '../blocks/Option.js';
import type { OptionGroup } from '../blocks/OptionGroup.js';
import type { View } from '../surfaces/View.js';

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
	rid?: string;
	triggerId: string;
};

export type MessageBlockSuggestionUserInteraction = {
	type: 'blockSuggestion';
	actionId: string;
	blockId: string;
	appId: string;
	/** What the user has typed so far. */
	value: string;
	container: {
		type: 'message';
		id: string;
	};
	mid: string;
	tmid?: string;
	rid: string;
	triggerId: string;
};

export type ViewBlockSuggestionUserInteraction = {
	type: 'blockSuggestion';
	actionId: string;
	blockId: string;
	appId: string;
	/** What the user has typed so far. */
	value: string;
	container: {
		type: 'view';
		id: string;
	};
	viewId: string;
	rid?: string;
	triggerId: string;
};

export type BlockSuggestionUserInteraction = MessageBlockSuggestionUserInteraction | ViewBlockSuggestionUserInteraction;

export type BlockSuggestionResponse = {
	options?: Option[];
	option_groups?: OptionGroup[];
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
	rid?: string;
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
	rid?: string;
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
	| MessageBlockSuggestionUserInteraction
	| ViewBlockSuggestionUserInteraction
	| ViewClosedUserInteraction
	| ViewSubmitUserInteraction
	| MessageBoxActionButtonUserInteraction
	| UserDropdownActionButtonUserInteraction
	| MesssageActionButtonUserInteraction
	| RoomActionButtonUserInteraction;

export const isMessageBlockActionUserInteraction = typia.createIs<MessageBlockActionUserInteraction>();
export const isViewBlockActionUserInteraction = typia.createIs<ViewBlockActionUserInteraction>();
export const isMessageBlockSuggestionUserInteraction = typia.createIs<MessageBlockSuggestionUserInteraction>();
export const isViewBlockSuggestionUserInteraction = typia.createIs<ViewBlockSuggestionUserInteraction>();
export const isViewClosedUserInteraction = typia.createIs<ViewClosedUserInteraction>();
export const isViewSubmitUserInteraction = typia.createIs<ViewSubmitUserInteraction>();
export const isMessageBoxActionButtonUserInteraction = typia.createIs<MessageBoxActionButtonUserInteraction>();
export const isUserDropdownActionButtonUserInteraction = typia.createIs<UserDropdownActionButtonUserInteraction>();
export const isMesssageActionButtonUserInteraction = typia.createIs<MesssageActionButtonUserInteraction>();
export const isRoomActionButtonUserInteraction = typia.createIs<RoomActionButtonUserInteraction>();
