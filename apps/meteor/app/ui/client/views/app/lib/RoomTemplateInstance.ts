import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';
import type { Dispatch, MutableRefObject, SetStateAction, UIEvent } from 'react';

import type { messageContext } from '../../../../../ui-utils/client/lib/messageContext';
import type { ChatMessages } from '../../../lib/ChatMessages';
import type { Uploading } from '../../../lib/fileUpload';
import type { CommonRoomTemplateInstance } from './CommonRoomTemplateInstance';

export type UnreadData = { count?: number; since?: moment.MomentInput };

export type RoomTemplateInstance = Blaze.TemplateInstance<{}> &
	CommonRoomTemplateInstance & {
		data: {
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
			selectedMessagesRef: MutableRefObject<IMessage['_id'][]>;
			selectedRangeRef: MutableRefObject<IMessage['_id'][]>;
			selectablePointerRef: MutableRefObject<IMessage['_id'] | undefined>;
			atBottomRef: MutableRefObject<boolean>;
			lastScrollTopRef: MutableRefObject<number>;
			messagesBoxRef: MutableRefObject<HTMLDivElement | null>;
			wrapperRef: MutableRefObject<HTMLDivElement | null>;
			selectMessages: (to: IMessage['_id']) => void;
			getSelectedMessages: () => IMessage['_id'][];
			isAtBottom: (threshold?: number) => boolean;
			sendToBottom: () => void;
			sendToBottomIfNecessary: () => void;
			checkIfScrollIsAtBottom: () => void;
			noNewMessage: boolean;
			setNoNewMessage: Dispatch<SetStateAction<boolean>>;
			chatMessagesInstance: ChatMessages;
			handleNewMessageButtonClick: () => () => void;
			handleJumpToRecentButtonClick: () => (event: UIEvent) => void;
			containerBarsShow: (unreadData: UnreadData, uploading: Uploading[]) => void;
			unreadData: UnreadData;
			uploading: Uploading[];
			messageViewMode: '' | 'cozy' | 'compact';
			hasLeader: string | undefined;
			hasMore: boolean;
			hasMoreNext: boolean;
			isLoading: boolean;
			canPreview: boolean;
			roomLeader: unknown;
			handleOpenUserCardButtonClick: (username: string) => () => (event: MouseEvent) => void;
			hideUsername: string | undefined;
			hideAvatar: string | undefined;
			useLegacyMessageTemplate: boolean | undefined;
			messagesHistory: IMessage[];
			handleUnreadBarJumpToButtonClick: () => (event: MouseEvent) => void;
			handleMarkAsReadButtonClick: () => (event: MouseEvent) => void;
			handleUploadProgressCloseButtonClick: (id: Uploading['id']) => () => (event: MouseEvent) => void;
			retentionPolicy:
				| {
						filesOnly: boolean;
						excludePinned: boolean;
						maxAge: number;
				  }
				| undefined;
			messageContext: ReturnType<typeof messageContext>;
		};
	};
