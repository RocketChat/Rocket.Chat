import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';
import type { ReactiveDict } from 'meteor/reactive-dict';

import type { CommonRoomTemplateInstance } from './CommonRoomTemplateInstance';

export type RoomTemplateInstance = CommonRoomTemplateInstance &
	Blaze.TemplateInstance<{
		_id: string;
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
		state: ReactiveDict<{
			announcement: string;
			count: number;
			subscribed: boolean;
			lastMessage: Date;
			autoTranslate: unknown;
			autoTranslateLanguage: unknown;
			newMessage: boolean;
			userDetail: string;
			unreadCount: number;
			subscription: ISubscription;
			hideLeaderHeader: boolean;
			selectable: boolean;
		}>;
		rid: string;
		room: IRoom | undefined;
		rolesObserve: Meteor.LiveQueryHandle | undefined;
	};
