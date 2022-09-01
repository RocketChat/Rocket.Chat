import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
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
		selectedMessages: IMessage['_id'][];
		selectedRange: IMessage['_id'][];
		selectablePointer: string | undefined;
		atBottom: boolean | undefined;

		observer: ResizeObserver | undefined;
		lastScrollTop: number;

		resetSelection: (enabled: boolean) => void;
		selectMessages: (messages: string) => void;
		getSelectedMessages: () => IMessage['_id'][];
		sendToBottomIfNecessary: () => void;
		isAtBottom: (threshold?: number) => boolean;
		sendToBottom: () => void;
		checkIfScrollIsAtBottom: () => void;
	};
