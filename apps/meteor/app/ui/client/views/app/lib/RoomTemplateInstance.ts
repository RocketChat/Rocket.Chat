import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';
import type { Dispatch, SetStateAction } from 'react';

import type { CommonRoomTemplateInstance } from './CommonRoomTemplateInstance';

export type RoomTemplateInstance = CommonRoomTemplateInstance &
	Blaze.TemplateInstance<{
		_id: string;
		room: IRoom | null | undefined;
		subscription: ISubscription | null | undefined;
		count: number;
		setCount: Dispatch<SetStateAction<number>>;
		selectable: boolean;
		setSelectable: Dispatch<SetStateAction<boolean>>;
		subscribed: boolean;
		lastMessage: Date | undefined;
		setLastMessage: Dispatch<SetStateAction<Date | undefined>>;
		userDetail: string;
		hideLeaderHeader: boolean;
		setHideLeaderHeader: Dispatch<SetStateAction<boolean>>;
		unreadCount: number;
		setUnreadCount: Dispatch<SetStateAction<number>>;
	}> & {
		resetSelection: (enabled: boolean) => void;
		selectedMessages: unknown[];
		getSelectedMessages: () => unknown[];
		selectMessages: (messages: string) => void;
		selectedRange: unknown[];
		selectablePointer: string | undefined;
		atBottom: boolean | undefined;
		sendToBottomIfNecessary: () => void;
		checkIfScrollIsAtBottom: () => void;
		observer: ResizeObserver | undefined;
		lastScrollTop: number;
		isAtBottom: (threshold?: number) => boolean;
		sendToBottom: () => void;
		rolesObserve: Meteor.LiveQueryHandle | undefined;
	};
